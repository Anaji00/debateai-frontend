// src/lib/audio.ts

// If backend returns just a filename, we mount static files here:
export function buildAudioUrlFromFilename(filename?: string | null) {
  if (!filename) return null;
  const f = String(filename).trim();
  if (!f) return null;
  if (f.startsWith("http://") || f.startsWith("https://") || f.startsWith("/")) return f;
  return `/static/audio/generated/${f}`;
}

// In case future mapping by speaker is needed; for now we ignore name and use filename.
export function resolveAudioPath(_rawSpeaker: string, filename?: string | null) {
  return buildAudioUrlFromFilename(filename);
}
