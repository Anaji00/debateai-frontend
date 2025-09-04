/**
 * Single source of truth for mode keys used internally everywhere.
 * We keep internal keys short/stable and map labels in the UI layer.
 *
 * Keys:
 *  - "Solo"            => Solo vs Character (one character vs abstract assistant)
 *  - "Versus"          => Character vs Character (two characters)
 *  - "Devil's Advocate"=> Assistant mode that challenges the user
 */
export type DebateModeKey = "Solo" | "Versus" | "Devil's Advocate";

/**
 * Human-facing labels for buttons and displays.
 * The UI can show these, but state should store the keys above.
 */
export const MODE_LABELS: Record<DebateModeKey, string> = {
  Solo: "Solo",
  Versus: "Versus",
  "Devil's Advocate": "Devil's Advocate",
};

/**
 * Optional reverse map if you ever receive a label string and need to convert.
 * (Not used by the components below, but handy for defensive code.)
 */
export const LABEL_TO_KEY: Record<string, DebateModeKey> = {
  "Solo": "Solo",
  "Versus": "Versus",
  "Devil's Advocate": "Devil's Advocate",
};
