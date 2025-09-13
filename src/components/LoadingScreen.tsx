
// Import the `motion` component from framer-motion, which is the core of the library.
// It automatically handles animations when its props change.
// `useReducedMotion` is a hook to detect if the user has requested reduced motion in their OS settings.
import { motion, useReducedMotion } from "framer-motion";

// Define a type for the color accents used in the component.
type Accent = "amber" | "sky";

// Create a configuration object to map accent names to specific Tailwind CSS classes.
// This makes it easy to switch color themes.
const ACCENT: Record<
  Accent,
  { dot: string; ring: string; gradFrom: string; gradTo: string }
> = {
  amber: {
    dot: "bg-amber-400",
    ring: "ring-amber-400/40",
    gradFrom: "from-amber-400",
    gradTo: "to-sky-400",
  },
  sky: {
    dot: "bg-sky-400",
    ring: "ring-sky-400/40",
    gradFrom: "from-sky-400",
    gradTo: "to-amber-400",
  },
};

// --- LoadingDots Component --------------------------------------------------
// This component displays three bouncing dots, a common loading indicator.
function LoadingDots({
  accent = "amber",
  size = 6,
  delay = 0.12,
}: {
  accent?: Accent;
  size?: number;
  delay?: number;
}) {
  // Hook to check if the user prefers reduced motion for accessibility.
  const prefersReduced = useReducedMotion();
  // Get the correct CSS classes based on the chosen accent color.
  const a = ACCENT[accent];
  const cls = `rounded-full ${a.dot}`;

  // If the user prefers reduced motion, we render static dots without any animation.
  // This is a crucial accessibility best practice.
  if (prefersReduced) {
    return (
      <span className="inline-flex gap-1 align-middle" aria-hidden="true">
        <span className={cls} style={{ width: size, height: size }} />
        <span className={cls} style={{ width: size, height: size }} />
        <span className={cls} style={{ width: size, height: size }} />
      </span>
    );
  }

  // If animations are enabled, we render the animated dots.
  return (
    <span className="inline-flex gap-1 align-middle" aria-hidden="true">
      {/* We create an array of three numbers to map over, creating three dots. */}
      {[0, 1, 2].map((i) => (
        // Each dot is a `motion.span` component.
        <motion.span
          key={i}
          className={cls}
          style={{ width: size, height: size }}
          // --- ✨ DOT ANIMATION LOGIC ---
          // The `animate` prop defines the state the component should animate to.
          // Here, we're creating a keyframe animation for the `y` (vertical position)
          // and `opacity` properties. The dot will move up and down and fade slightly.
          animate={{ y: [-2, 2, -2], opacity: [0.7, 1, 0.7] }}
          // The `transition` prop configures the animation's behavior.
          transition={{
            duration: 0.6,
            repeat: Infinity, // This makes the animation loop forever.
            // `repeatType: "reverse"` would make it play forwards then backwards.
            // The default `repeatType: "loop"` makes it restart from the beginning.
            // A delay is applied to each dot, creating a staggered, wave-like effect.
            delay: i * delay,
          }}
        />
      ))}
    </span>
  );
}

// --- LoadingScreen Component -------------------------------------------------
// This is the main component that shows a loading panel.
export default function LoadingScreen({
  title = "Loading…",
  accent = "amber",
  fullscreen = false,
}: {
  title?: string;
  accent?: Accent;
  /** If true, fills the entire viewport; otherwise, it's a tall panel for route fallbacks. */
  fullscreen?: boolean;
}) {
  // Again, we check for the user's motion preference.
  const prefersReduced = useReducedMotion();
  const a = ACCENT[accent];

  return (
    // This outer div centers the loading card.
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`${fullscreen ? "min-h-screen" : "min-h-[60vh]"} grid place-items-center bg-transparent px-4`}
    >
      {/* This is the main animated card. */}
      <motion.div
        // --- ✨ CARD ANIMATION LOGIC ---
        // `initial`: The state of the component *before* it animates in.
        // Here, it starts invisible (opacity: 0) and slightly moved down (y: 8).
        // If the user prefers reduced motion, this is `undefined`, so no animation occurs.
        initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
        // `animate`: The state the component animates *to*.
        // It becomes fully visible (opacity: 1) and moves to its final position (y: 0).
        animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
        // `transition`: Configures the animation, in this case a quick 0.22-second fade-in.
        transition={{ duration: 0.22 }}
        className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950/70 backdrop-blur px-6 py-6 shadow-xl shadow-black/30"
      >
        <div className="flex items-center justify-between">
          <div
            className={`text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r ${a.gradFrom} ${a.gradTo}`}
          >
            DebateAI
          </div>
          <LoadingDots accent={accent} />
        </div>

        {/* These are "skeleton" placeholders that pulse to indicate content is loading. */}
        <div className="mt-6 space-y-3" aria-hidden="true">
          <div className="h-4 w-3/4 rounded bg-neutral-800 animate-pulse" />
          <div className="h-4 w-5/6 rounded bg-neutral-800 animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-neutral-800 animate-pulse" />
        </div>

        <div className="mt-6 text-sm text-neutral-400">{title}</div>
      </motion.div>
    </div>
  );
}
