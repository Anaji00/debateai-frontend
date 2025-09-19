// Import type definitions and components needed for character setup.
import type { DebateModeKey } from "../types/DebateMode";
import CharacterSelector from "./CharacterSelector";
import type { CharData } from "../data/CharData";
import { DEFAULT_CHAR } from "../data/CharData";
import { useEffect } from "react";

// This component orchestrates the entire pre-debate setup UI.
export default function CharacterSetup(props: {
  mode: DebateModeKey;
  character_1: string; setCharacter_1: (v: string) => void; // State for the first character.
  character_2: string; setCharacter_2: (v: string) => void;
  input: string; setInput: (v: string) => void;
  debateStarted: boolean;
  loading: boolean;
  handlePrimaryAction: () => void;
  resetDebate?: () => void;
  characters?: CharData[];
}) {
  const {
    // Destructure all props for cleaner access within the component.
    mode, character_1, setCharacter_1, character_2, setCharacter_2,
    input, setInput, debateStarted, loading, handlePrimaryAction, resetDebate,
    characters = DEFAULT_CHAR, // Use default characters if none are provided.
  } = props;

  // --- UI Logic and State Derivation ---
  // These constants are derived from props and determine how the component renders.
  // This is more efficient than re-calculating these values multiple times in the JSX.

  // `needsTwo` is true only if the mode is "Versus", requiring two character selections.
  const needsTwo = mode === "Versus";
  // `requiresChar` is false only for "Devil's Advocate" mode, which doesn't need a pre-selected character.
  const requiresChar = mode !== "Devil's Advocate";
  // `maxSelections` is passed to the CharacterSelector to configure its behavior (1 for Solo, 2 for Versus).
  const maxSelections: 1 | 2 = needsTwo ? 2 : 1;

  // This is a state cleanup effect. If the user switches from a two-player mode to a one-player mode,
  // we must clear the second character to avoid inconsistent or "stale" state.
  useEffect(() => {
    if (!needsTwo && character_2) setCharacter_2("");
  }, [needsTwo, character_2, setCharacter_2]);

  // --- Form Validation ---
  // These constants check if the form is in a valid state to start the debate.

  // `hasRequiredChars` checks if the character selection part of the form is complete.
  const hasRequiredChars =
    !requiresChar || (character_1 && (!needsTwo || character_2));

  // `topic` is the trimmed version of the user's input, ensuring whitespace doesn't count.
  const topic = input?.trim() ?? "";
  // `isValid` combines all conditions: a topic must exist, and characters must be selected if required.
  const isValid = !!topic && hasRequiredChars;

  // `disabled` determines the state of the primary action button ("Start" or "Send").
  const disabled =
    (!debateStarted && (!isValid || loading)) || // Before debate: disable if form is invalid or loading.
    (debateStarted && loading); // During debate: disable only when loading.

  // This function provides the logic for the "Randomize" button inside the CharacterSelector.
  const randomPick = () => {
    if (!requiresChar || !characters.length) return; // Exit if no characters are needed or available.
    const pool = characters.map((c) => c.name.trim()).filter(Boolean);
    // Handle 'Solo' mode: pick one random character and ensure the second is cleared.
    if (maxSelections === 1) {
      const i = Math.floor(Math.random() * pool.length);
      setCharacter_1(pool[i] ?? "");
      setCharacter_2("");
    } else {
      // Logic for 'Versus' mode (picking two *different* characters).
      if (pool.length < 2) return; // Can't pick two if there aren't enough.
      // Pick two distinct random indices.
      let i1 = Math.floor(Math.random() * pool.length);
      let i2 = Math.floor(Math.random() * (pool.length - 1));
      if (i2 >= i1) i2 += 1; // Ensure i2 is different from i1
      setCharacter_1(pool[i1] ?? "");
      setCharacter_2(pool[i2] ?? "");
    }
  };

  // This provides a dynamic, helpful hint to guide the user on what to do next to complete the setup.
  const missingHint =
    !requiresChar ? "" :
    !character_1 ? "Pick a character to start." :
    needsTwo && !character_2 ? "Pick the second character." :
    "";

  return (
    // --- Component Render ---
    // The root element for the setup UI, using flexbox for layout.
    <div className="p-4 flex flex-col gap-4 border-b border-neutral-800">
      {requiresChar && (
        // This block renders the character selection UI, but only if the current mode requires it.
        <div className="flex flex-col gap-2">
          <CharacterSelector
            characters={characters}
            first={character_1}
            second={character_2}
            onSelectFirst={setCharacter_1}
            onSelectSecond={setCharacter_2}
            maxSelections={maxSelections}
            disabled={debateStarted || loading}
            showRandom
            onRandomClick={randomPick}
          />
          {/* Conditionally render the hint if something is missing and the debate hasn't started yet. */}
          {!!missingHint && !debateStarted && (
            <div className="text-xs text-amber-400">{missingHint}</div>
          )}
        </div>
      )}

      {/* This block renders the input field for the debate topic. */}
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Debate Topic / Prompt"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={debateStarted}
          className="flex-[2] min-w-[300px] p-3 rounded border border-neutral-700 bg-neutral-900 text-neutral-100 disabled:opacity-60"
          aria-label="Debate Topic / Prompt"
        />
        {/* Conditionally render a hint if the topic is empty and the debate hasn't started. */}
        {!topic && !debateStarted && (
          <div className="text-xs text-amber-400">Enter a topic or prompt.</div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* The primary action button. Its text and behavior change based on `debateStarted`. */}
        <button
          onClick={handlePrimaryAction}
          disabled={disabled}
          className={`px-5 py-3 rounded text-white transition ${
            disabled
              ? "bg-emerald-500/60 cursor-not-allowed"
              : "bg-emerald-500 hover:bg-emerald-600"
          }`}
        >
          {debateStarted ? "Send" : "Start"}
        </button>

        {/* The "New Debate" button, which only appears after a debate has started, allowing the user to reset the session. */}
        {debateStarted && resetDebate && (
          <button
            onClick={resetDebate}
            className="px-4 py-3 bg-neutral-800 text-white border border-neutral-700 rounded hover:bg-neutral-700 transition"
          >
            🔄 New Debate
          </button>
        )}
      </div>
    </div>
  );
}
