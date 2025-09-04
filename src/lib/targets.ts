// src/lib/targets.ts
import { getAllAliases, toBackendName } from "../types/aliasMap";

/** Detect which speakers the user is addressing (case-insensitive, word-boundary). */
export function detectTargetSpeakers(userText: string): string[] {
  const t = (userText ?? "").toLowerCase();
  if (!t) return [];
  const found = new Set<string>();

  for (const { canon, alias } of getAllAliases()) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").toLowerCase();
    const re = new RegExp(`\\b${escaped}\\b`, "i");
    if (re.test(t)) found.add(canon);
  }
  return Array.from(found);
}

/** Safety: if anything slips through in display form, re-normalize to canon lowercase. */
export function normalizeAddressees(addressees?: string[]): string[] | undefined {
  if (!addressees?.length) return undefined;
  const out = new Set<string>();
  for (const a of addressees) out.add(toBackendName(a));
  return Array.from(out);
}
