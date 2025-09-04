// --- display name normalizer: canonical (lowercase) -> pretty display
function titleCaseName(s: string) {
  return (s || "").trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// Add exceptions if needed:
const DISPLAY_EXCEPTIONS: Record<string, string> = {
  "donald trump": "Donald Trump",
  "thanos": "Thanos",
  // ...
};

function displayFromCanonical(raw: string) {
  const k = (raw || "").trim().toLowerCase();
  return DISPLAY_EXCEPTIONS[k] ?? titleCaseName(k);
}

export function toDisplayName(raw: string) {
  return displayFromCanonical(raw);
}