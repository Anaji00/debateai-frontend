import { motion } from "framer-motion";
import type { CharData } from "../data/CharData";

export default function CharacterCard({
  character,
  isSelected,
  disabled = false,
  onSelect,
}: {
  character: CharData;
  isSelected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onSelect()}
      whileTap={disabled ? {} : { scale: 0.98 }}
      aria-pressed={isSelected}
      aria-label={`Select ${character.name}`}
      className={[
        "group relative w-full h-40 sm:h-44 md:h-48 overflow-hidden rounded-2xl border transition",
        "flex flex-col justify-end text-left",
        "bg-neutral-900 border-neutral-700",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40",
        isSelected
          ? "ring-2 ring-amber-400 border-amber-400"
          : "ring-1 ring-transparent hover:border-amber-400/50",
      ].join(" ")}
    >
      {/* Portrait */}
      <img
        src={character.imageUrl}
        alt={character.name}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-90"
      />

      {/* Ambient glow on hover/active */}
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity",
          // amber + sky soft glows
          "bg-[radial-gradient(60%_60%_at_20%_80%,rgba(251,191,36,0.18),transparent_60%),",
          "radial-gradient(60%_60%_at_80%_20%,rgba(56,189,248,0.18),transparent_60%)]",
        ].join(" ")}
      />

      {/* Bottom gradient + name/quote; driven by parent hover/focus */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className={[
          "pointer-events-none absolute inset-x-0 bottom-0 p-3",
          "bg-gradient-to-t from-black/70 via-black/20 to-transparent",
          "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity",
          "flex flex-col gap-1",
        ].join(" ")}
      >
        <h3 className="text-sm font-semibold text-white drop-shadow-md">
          {character.name}
        </h3>

        {character.quote && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.8 }}
            className="text-xs text-neutral-200/95 italic max-h-12 overflow-hidden"
          >
            “{character.quote}”
          </motion.p>
        )}
      </motion.div>
    </motion.button>
  );
}
