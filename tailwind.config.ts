import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Universal Palette
        primary: {
          DEFAULT: "#2563eb", // Professional Blue
          hover: "#1d4ed8",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#64748b", // Slate Grey
          hover: "#475569",
          foreground: "#f8fafc",
        },
        accent: {
          DEFAULT: "#f59e0b", // Amber
          foreground: "#ffffff",
        },
        // Semantic Surfaces
        surface: "#f8fafc", // Light background
        card: "#ffffff",    // Content containers
      },
    },
  },
  plugins: [],
};
export default config;