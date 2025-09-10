// tailwind.config.ts
import { keyframes } from "framer-motion";
import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",   // <- important
  ],
  theme: {
    extend: {
      keyframes: {
        blink: {
          "0%, 100%": { opacity: 0 },
          "50%": { opacity: 1 },
        },
      },
      animation: {
        blink: "blink 1s steps(2, start) infinite",
      },
  },
},
  plugins: [],
} satisfies Config;
// tailwind.config.ts