// Import React hooks for performance optimizations.
import { useCallback, useMemo } from "react";
// Import `motion` for animations.
import { motion } from "framer-motion";
// Import the card component used to display each character.
import CharacterCard from "../components/CharacterCard";
// Import the type definition for a character's data.
import type { CharData } from "../data/CharData";

// This is the main component function. It receives props to manage its state and behavior.
export default function CharacterSelector({
  characters,
  first,
  second,
  onSelectFirst,
  onSelectSecond,
  maxSelections = 2, // 1 for Solo mode, 2 for Versus mode.
  disabled = false,
  showRandom = true,
  onRandomClick,
}: {
  characters: CharData[];
  first?: string;
  second?: string;
  onSelectFirst: (name: string) => void;
  onSelectSecond: (name: string) => void;
  maxSelections?: 1 | 2;
  disabled?: boolean;
  showRandom?: boolean;
  onRandomClick?: () => void;
}) {
  // `useMemo` creates a Set of selected character names.
  // This is an efficient way to check if a character is selected.
  // It only recalculates when `first` or `second` props change.
  const selectedSet = useMemo(
    () => new Set([first, second].filter(Boolean) as string[]),
    [first, second]
  );

  // `useCallback` memoizes this function so it isn't recreated on every render.
  // This function handles the logic when a user clicks on a character card.
  const handleSelect = useCallback(
    (name: string) => {
      if (disabled) return; // Do nothing if the selector is disabled.

      // In 'Solo' mode (maxSelections is 1), just set the first character.
      if (maxSelections === 1) {
        onSelectFirst(name);
        return;
      }

      // Versus: fill P1 then P2 (distinct)
      if (!first) {
        onSelectFirst(name); // If Player 1 isn't chosen, this click selects them.
        return;
      }
      if (!second && name !== first) {
        onSelectSecond(name); // If Player 2 isn't chosen (and it's a different character), this click selects them.
        return;
      }

      // Optional toggle behavior in Versus:
      // If the user clicks the currently selected P2, it deselects P2.
      if (name === second) {
        onSelectSecond("");
        return;
      }
      // If the user clicks the currently selected P1, it deselects P1.
      if (name === first) {
        onSelectFirst("");
        return;
      }

      // If both picked and you click a third, replace P2.
      if (first && second && name !== first) {
        onSelectSecond(name);
      }

    },
    [disabled, maxSelections, first, second, onSelectFirst, onSelectSecond]
  );

  // This function handles what happens when the 'Random' button is clicked.
  const handleRandom = useCallback(() => {
    if (disabled || characters.length === 0) return; // Exit if disabled or no characters are available.

    // If a custom random click handler is provided, use it instead of the default logic.
    if (typeof onRandomClick === "function") {
      onRandomClick();
      return;
    }

    // Create a "pool" of character names to pick from.
    const pool = characters.map((c) => c.name); 
    if (maxSelections === 1) {
      const idx = Math.floor(Math.random() * pool.length);
      onSelectFirst(pool[idx]);
      onSelectSecond(""); // ensure second is clear for Solo
      return;
    }

    // For 'Versus' mode, we need to pick two *different* random characters.
    if (pool.length < 2) return; // Can't pick two if there aren't at least two.
    let idx1 = Math.floor(Math.random() * pool.length);
    let idx2;
    do {
      idx2 = Math.floor(Math.random() * pool.length);
    } while (idx2 === idx1);
    onSelectFirst(pool[idx1]);
    onSelectSecond(pool[idx2]);
  }, [disabled, characters, maxSelections, onRandomClick, onSelectFirst, onSelectSecond]);

  // This function provides keyboard accessibility.
  // It allows selecting a character with the Enter or Space key when a card is focused.
  const handleKeySelect = (name: string) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelect(name);
    }
  };

  // The JSX that renders the component's UI.
  return (
    <div className="space-y-4">
      {/* Header section with the title and random button. */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-100">
          {maxSelections === 1 ? "Choose your fighter" : "Choose your fighters"}
        </h2>

        {/* The randomizer button, which is only shown if `showRandom` is true. */}
        {showRandom && (
          <motion.button
            type="button"
            className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 focus:outline-none disabled:opacity-50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRandom}
            title="Randomize"
            disabled={disabled || (maxSelections === 2 && characters.length < 2)}
            aria-label="Randomize"
          >
            <span role="img" aria-label="Randomize">🎲</span>
          </motion.button>
        )}
      </div>

      {/* This is the grid where all the character cards are displayed. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {characters.map((c) => {
          // For each character, determine if it's selected and if it's Player 1 or Player 2.
          const isSelected = selectedSet.has(c.name);
          const isP1 = c.name === first;
          const isP2 = c.name === second;

          // The wrapper div makes the whole area clickable and focusable for accessibility.
          return (
            <div
              key={c.name}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-pressed={isSelected}
              aria-label={`Select ${c.name}`}
              onKeyDown={handleKeySelect(c.name)}
              className="relative"
            >
              {/* The actual CharacterCard component. */}
              <CharacterCard
                character={c}
                isSelected={isSelected}
                onSelect={() => handleSelect(c.name)}
              />

              {/* This badge shows "P1" or "P2" on the card in Versus mode. */}
              {maxSelections === 2 && isSelected && (
                <div className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-black/70 text-white border border-white/20">
                  {isP1 ? "P1" : isP2 ? "P2" : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
