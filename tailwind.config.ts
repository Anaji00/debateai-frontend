// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",   // <- important
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
// tailwind.config.ts