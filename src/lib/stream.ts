// src/lib/stream.ts
// Strict NDJSON streaming decoder for fetch() Response bodies.
// - Uses TextDecoder(stream: true) so multibyte UTF-8 codepoints don't split
// - Carries partial lines between chunks
// - Emits ONLY complete, parsed JSON lines (no raw fragments)
// - Does NOT trim lines (preserves spaces/newlines the model meant to send)

export type StreamOptions = { signal?: AbortSignal };

export async function streamJSON<T = unknown>(
  res: Response,
  onEvent: (ev: T) => void,
  opts: StreamOptions = {}
) {
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await safeText(res)}`);
  }
  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder("utf-8", { fatal: false });
  let carry = ""; // partial line across chunks

  const { signal } = opts;
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
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      let data = carry + chunk;

      // Split on newline; keep the trailing partial in `carry`
      const lines = data.split("\n");
      carry = lines.pop() ?? "";

      for (const line of lines) {
        if (line.length === 0) continue; // ignore truly empty keep-alives
        try {
          // IMPORTANT: do NOT trim; parse as-is
          const obj = JSON.parse(line);
          onEvent(obj as T);
        } catch {
          // Not valid JSON (e.g., proxy noise) → ignore quietly
        }
      }
    }

    // Flush the decoder and any final line if it's complete JSON
    const tail = decoder.decode();
    if (tail) carry += tail;
    if (carry) {
      try {
        const obj = JSON.parse(carry);
        onEvent(obj as T);
      } catch {
        // Incomplete final line → ignore
      }
    }
  } finally {
    if (signal && onAbort) signal.removeEventListener("abort", onAbort);
    try { await reader.cancel(); } catch {}
  }
}

async function safeText(res: Response) {
  try { return await res.text(); } catch { return "<unreadable body>"; }
}
