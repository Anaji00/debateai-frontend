// src/lib/stream.ts
// A resilient streaming reader for JSONL and SSE (`data:`) lines.
// - Works with fetch Response bodies
// - Handles partial chunks & tail
// - Supports AbortSignal (reader.cancel on abort)
// - Supports SSE multiline events (coalesce until blank line)
// - Falls back when TextDecoderStream is not available
// - Optional debug logging for malformed lines (disabled by default)

export type StreamJSONOptions = {
  signal?: AbortSignal;
  // If true, logs malformed lines in dev; stays silent in prod builds
  debug?: boolean;
};

export async function streamJSON<T = any>(
  res: Response,
  onEvent: (evt: T) => void,
  opts: StreamJSONOptions = {}
) {
  if (!res.ok || !res.body) throw new Error(`No Body to stream (HTTP ${res.status})`);

  const { signal, debug = false } = opts;

  // We’ll prefer TextDecoderStream for simplicity, but fall back if needed
  const useDecoderStream = typeof TextDecoderStream !== "undefined";
  const reader = useDecoderStream
    ? res.body.pipeThrough(new TextDecoderStream()).getReader()
    : res.body.getReader();

  // Utility to decode Uint8Array chunks when TextDecoderStream isn't available
  const decode = (() => {
    if (useDecoderStream) return (u: Uint8Array) => (u as unknown as string); // already decoded
    const td = new TextDecoder("utf-8");
    return (u: Uint8Array) => td.decode(u, { stream: true });
  })();

  let buffer = "";          // for JSONL or generic line buffering
  let sseBuffer: string[] = []; // for multiline SSE events (multiple data: lines until blank line)

  const release = () => {
    try { reader.cancel?.(); } catch {}
  };

  // Abort support: cancel the reader if the signal fires
  const onAbort = () => release();
  if (signal) {
    if (signal.aborted) {
      release();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
  }

  try {
    // Read until EOF
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      // Convert bytes to text if we didn't use TextDecoderStream
      const chunkText = useDecoderStream ? (value as string) : decode(value as Uint8Array);
      buffer += chunkText;

      // Split into lines and keep the trailing partial in `buffer`
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) {
          // SSE delimiter: blank line ends an event (coalesce accumulated data lines)
          if (sseBuffer.length > 0) {
            const joined = sseBuffer.join("\n").trim();
            sseBuffer = [];
            if (!joined) continue;
            try {
              onEvent(JSON.parse(joined));
            } catch (e) {
              if (debug && isDev()) console.warn("[streamJSON] Bad SSE JSON:", joined, e);
            }
          }
          continue;
        }

        // Ignore SSE comment lines like ":" heartbeats
        if (line.startsWith(":")) continue;

        // Handle SSE lines that start with "data:"
        if (line.startsWith("data:")) {
          const payload = line.slice(5).trim();
          // Some servers emit one JSON per data line (JSONL-over-SSE); others split JSON across many data lines.
          // We push and only parse when we hit a blank line (above).
          sseBuffer.push(payload);

          // If your server NEVER uses multiline SSE (each `data:` is a full JSON), you can parse immediately:
          // try { onEvent(JSON.parse(payload)); } catch {}
          // but the safer approach is to wait for blank line delimiter.
          continue;
        }

        // Otherwise, treat as plain JSONL
        try {
          onEvent(JSON.parse(line));
        } catch (e) {
          if (debug && isDev()) console.warn("[streamJSON] Bad JSONL:", line, e);
        }
      }
    }

    // End-of-stream: flush tail(s)
    // 1) Flush SSE buffer if any
    if (sseBuffer.length > 0) {
      const joined = sseBuffer.join("\n").trim();
      sseBuffer = [];
      if (joined) {
        try { onEvent(JSON.parse(joined)); } catch (e) {
          if (debug && isDev()) console.warn("[streamJSON] Bad SSE tail JSON:", joined, e);
        }
      }
    }

    // 2) Flush leftover buffer line
    const tail = buffer.trim();
    if (tail) {
      const jsonStr = tail.startsWith("data:") ? tail.slice(5).trim() : tail;
      try { onEvent(JSON.parse(jsonStr)); } catch (e) {
        if (debug && isDev()) console.warn("[streamJSON] Bad tail JSON:", jsonStr, e);
      }
    }
  } finally {
    if (signal) signal.removeEventListener("abort", onAbort);
    release();
  }
}

function isDev() {
  // Prefer your own dev check if you have one (e.g., import.meta.env.DEV)
  // This generic check is fine as a fallback.
  return typeof process !== "undefined" ? process.env?.NODE_ENV !== "production" : true;
}
