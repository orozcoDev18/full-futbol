import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: { DEFAULT: "#0b6b3a", dark: "#064e2a", light: "#12a05a" },
      },
    },
  },
  plugins: [],
} satisfies Config;
