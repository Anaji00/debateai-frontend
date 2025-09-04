// src/lib/text.ts

// Remove leading "Name: text" patterns so models see a clean prompt.
export function sanitizeUserSeed(seed: string, names: string[] = []): string {
  if (!seed) return seed;
  const pattern = new RegExp(`^\\s*(?:${names.map(escapeRe).join("|")}):\\s*`, "i");
  return seed.replace(pattern, "");
}

export function unwrapJson(raw: string): { text: string; audio?: string | null } {
  try {
    const obj = JSON.parse(raw);
    if (typeof obj?.text === "string") return obj;
  } catch {}
  return { text: raw };
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
