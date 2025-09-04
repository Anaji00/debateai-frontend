// src/types/aliasMap.ts
// Keep canonical + aliases *lowercase* for backend keys.
// UI uses toDisplayName to present pretty labels.

export const canonicalToAliases: Record<string, string[]> = {
  "thanos": ["thanos", "the titan"],
  "donald trump": ["donald trump", "trump", "the businessman"],
  // add more characters here...
};

// Pretty display mapping (first alias capitalized or custom)
const prettyName: Record<string, string> = {
  "thanos": "Thanos",
  "donald trump": "Donald Trump",
};

export function toBackendName(name: string): string {
  const n = (name ?? "").toLowerCase().trim();
  if (!n) return n;
  // exact canon?
  if (canonicalToAliases[n]) return n;
  // alias -> canon
  for (const [canon, aliases] of Object.entries(canonicalToAliases)) {
    if (aliases.includes(n)) return canon;
  }
  return n; // fallback: already normalized string
}

export function toDisplayName(name: string | undefined | null): string {
  const canon = toBackendName(name ?? "");
  return prettyName[canon] ?? (canon ? canon.replace(/\b\w/g, c => c.toUpperCase()) : "");
}

export function getAllKnownNames(): string[] {
  const set = new Set<string>();
  for (const [canon, aliases] of Object.entries(canonicalToAliases)) {
    set.add(canon);
    aliases.forEach(a => set.add(a));
  }
  return Array.from(set).filter(Boolean);
}

// Optional: expose aliases as pairs for detection
export function getAllAliases(): Array<{ canon: string; alias: string }> {
  const out: Array<{ canon: string; alias: string }> = [];
  for (const [canon, aliases] of Object.entries(canonicalToAliases)) {
    aliases.forEach(alias => out.push({ canon, alias }));
  }
  return out;
}
