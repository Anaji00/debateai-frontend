import type { DebateModeKey } from "../types/DebateMode";

export default function CharacterSetup(props: {
  mode: DebateModeKey;
  character_1: string; setCharacter_1: (v: string) => void;
  character_2: string; setCharacter_2: (v: string) => void;
  input: string; setInput: (v: string) => void;
  debateStarted: boolean;
  loading: boolean;
  handlePrimaryAction: () => void;
  resetDebate?: () => void;
}) {
  const {
    mode, character_1, setCharacter_1, character_2, setCharacter_2,
    input, setInput, debateStarted, loading, handlePrimaryAction, resetDebate
  } = props;

  const needsTwo = mode === "Versus";           // only Versus shows 2 chars
  const requiresChar = mode !== "Devil's Advocate";

  const isValid =
    !!input &&
    (!requiresChar || !!character_1) &&
    (!needsTwo || !!character_2); // Only Versus needs char_2

  const disabled =
    (!debateStarted && (!isValid || loading)) ||
    (debateStarted && loading);

  return (
    <div className="p-4 flex flex-wrap items-center gap-3 border-b border-neutral-800">
      {requiresChar && (
        <input
          type="text"
          placeholder={needsTwo ? "Character 1" : "Character"}
          value={character_1}
          onChange={(e) => setCharacter_1(e.target.value)}
          disabled={debateStarted}
          className="flex-1 min-w-[220px] p-3 rounded border border-neutral-700 bg-neutral-900 text-neutral-100 disabled:opacity-60"
        />
      )}

      {needsTwo && (
        <input
          type="text"
          placeholder="Character 2"
          value={character_2}
          onChange={(e) => setCharacter_2(e.target.value)}
          disabled={debateStarted}
          className="flex-1 min-w-[220px] p-3 rounded border border-neutral-700 bg-neutral-900 text-neutral-100 disabled:opacity-60"
        />
      )}

      <input
        type="text"
        placeholder="Debate Topic / Prompt"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={debateStarted}
        className="flex-[2] min-w-[300px] p-3 rounded border border-neutral-700 bg-neutral-900 text-neutral-100 disabled:opacity-60"
      />

      <button
        onClick={handlePrimaryAction}
        disabled={disabled}
        className={`px-5 py-3 rounded text-white transition ${
          disabled ? "bg-emerald-500/60 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600"
        }`}
      >
        {debateStarted ? "Send" : "Start"}
      </button>

      {debateStarted && resetDebate && (
        <button
          onClick={resetDebate}
          className="px-4 py-3 bg-neutral-800 text-white border border-neutral-700 rounded hover:bg-neutral-700 transition"
        >
          🔄 New Debate
        </button>
      )}
    </div>
  );
}
