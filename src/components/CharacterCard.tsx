import {motion} from "framer-motion";
import type {CharData} from "../data/CharData";

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
            disabled = {disabled}
            onClick = {() => !disabled && onSelect()}
            className = {[
                "relative w-full h-40 sm:h-44 md:h-48 rounded-xl overflow-hidden border transition",
                "flex flex-col justify-end text-left bg-neutral-900 border-neutral-700",
                disabled 
                    ? "opacity-50 cursor-not-allowed" 
                    : "hover:shadow-lg focus:outline-none",
                isSelected ? "ring-4 ring-amber-400 animate-pulse" : "ring-1 ring-transparent",
            ].join(" ")}
            whileTap = {disabled ? {} : {scale: 0.98}}
            aria-pressed={isSelected}
            aria-label= {`Select ${character.name}`}
        >
            {/* Portrait fills card */}
            <img src={character.imageUrl} 
            alt={character.name} 
            className="absolute inset-0 object-cover w-full h-full" 
            loading="lazy"
            />


            {/* Overlay with name and gradient + hover effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 ease-in-out flex flex-col justify-end p-3 space-y-1">
                <h3 className="text-sm font-semibold text-white drop-shadow-md">
                 {character.name}
                </h3>
            {/* Quote is short; clamp visually via max-h to avoid layout jumps */}
                {character.quote && (
                    <p className="text-xs text-neutral-200 italic max-h-12 overflow-hidden">
                        "{character.quote}"
                    </p>
                )}
        </div>
    </motion.button>
    );
}
