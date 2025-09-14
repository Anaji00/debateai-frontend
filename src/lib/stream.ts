// src/lib/stream.ts
// Strict NDJSON streaming decoder for fetch() Response bodies.
// - Uses TextDecoder(stream: true) so multibyte UTF-8 codepoints don't split
// - Carries partial lines between chunks
// - Emits ONLY complete, parsed JSON lines (no raw fragments)
// - Preserves spaces INSIDE JSON fields
// - Safely discards a single trailing '\r' (CR) added by \r\n line endings

export type StreamOptions = { signal?: AbortSignal; debug?: boolean };

/**
 * Processes a fetch() Response body as a stream of NDJSON (Newline Delimited JSON).
 * Each valid JSON line is parsed and passed to the `onEvent` callback.
 *
 * @param res The `Response` object from a `fetch` call.
 * @param onEvent The callback function to execute for each parsed JSON object.
 * @param opts Optional parameters, including an AbortSignal and a debug flag.
 */
export async function streamJSON<T = unknown>(
  res: Response,
  onEvent: (ev: T) => void,
  opts: StreamOptions = {}
) {
  // 1. Basic setup and error handling
  // Ensure the response is successful (status 200-299).
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await safeText(res)}`);
  }
  // Get a reader to process the response body stream.
  const reader = res.body?.getReader();
  if (!reader) return;

  // Use TextDecoder to convert Uint8Array chunks into UTF-8 strings.
  // `fatal: false` prevents it from throwing on invalid UTF-8 sequences.
  const decoder = new TextDecoder("utf-8", { fatal: false });
  
  // `carry` stores any partial line from the end of a chunk to be prepended to the next.
  let carry = ""; 

  const { signal, debug = false } = opts;

  // 2. Helper function for parsing and event emission
  // This DRYs up the parsing logic used in the loop and at the end.
  function parseAndEmit(line: string) {
    // `trim()` handles trailing `\r` from `\r\n` and skips empty lines.
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      // Parse the line as JSON and call the user-provided callback.
      onEvent(JSON.parse(trimmed) as T);
    } catch (e) {
      // Log any JSON parsing errors if in debug mode.
      if (debug) console.warn("[streamJSON] drop bad JSON:", JSON.stringify(trimmed), e);
    }
  }

  // 3. AbortSignal handling
  // Allows the stream processing to be cancelled.
  let onAbort: (() => void) | undefined;
  if (signal) {
    if (signal.aborted) {
      try { await reader.cancel(); } catch {}
      return;
    }
    onAbort = () => { try { reader.cancel(); } catch {} };
    signal.addEventListener("abort", onAbort, { once: true });
  }

  try {
    // 4. Main processing loop
    while (true) {
      // Read the next chunk from the stream. `done` will be true when the stream ends.
      const { value, done } = await reader.read();
      if (done) break;

      // Decode the Uint8Array chunk to a string. `stream: true` is crucial
      // as it allows the decoder to handle multi-byte characters split across chunks.
      const chunk = decoder.decode(value, { stream: true });
      
      // Prepend any partial line from the previous chunk.
      const data = carry + chunk;
      
      // Split the data into lines based on the newline character.
      const lines = data.split('\n');

      // The last element of the split might be an incomplete line. We "carry" it
      // to the next iteration. If the chunk ends with a newline, `pop` returns
      // an empty string, which is correct.
      carry = lines.pop() || '';

      // Process each complete line.
      for (const line of lines) {
        parseAndEmit(line);
      }
    }

    // 5. Final flush
    // When the stream is done, flush the decoder for any remaining bytes.
    const tail = decoder.decode();
    if (tail) carry += tail;
    
    // If there's any remaining data in `carry`, it represents the final line. Parse it.
    if (carry) {
      parseAndEmit(carry);
    }

  } finally {
    // 6. Cleanup
    // Ensure the AbortSignal listener is removed and the reader is cancelled.
    if (signal && onAbort) signal.removeEventListener("abort", onAbort);
    try { await reader.cancel(); } catch {}
  }
}

/**
 * Safely reads the response body as text, returning a fallback on error.
 */
async function safeText(res: Response) {
  try { return await res.text(); } catch { return "<unreadable body>"; }
}