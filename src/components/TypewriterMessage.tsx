// src/components/TypewriterMessage.tsx
// Renders assistant text either:
// 1) Directly (best when your backend streams char-by-char — no double animation)
// 2) Simulated "typewriter" (when you receive a full chunk and still want a typing feel)
//
// Use `streaming={true}` if your backend pushes incremental text (recommended).
// Use `streaming={false}` to simulate typing from a final string.
// A blinking cursor can be shown while the message is "in progress".
