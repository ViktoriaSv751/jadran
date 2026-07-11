import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        // Neutral near-black — the editorial canvas: type, dark sections, lines.
        ink: {
          50: "#f7f7f8",
          100: "#ededf0",
          200: "#dcdce1",
          300: "#bcbcc5",
          400: "#8e8e99",
          500: "#62626c",
          600: "#45454d",
          700: "#2c2c32",
          800: "#19191d",
          900: "#0d0d10",
          950: "#070708"
        },
        // Airbnb "Rausch" red — the single vivid accent / CTAs / active states
        brand: {
          50: "#fff1f4",
          100: "#ffe0e7",
          200: "#ffc7d4",
          300: "#ff9fb4",
          400: "#ff6688",
          500: "#ff385c",
          600: "#e61e4d",
          700: "#bd1e59",
          800: "#9d1851",
          900: "#7d1244"
        },
        // Coastal teal — kept as a secondary accent for genuine sea/coast cues
        sea: {
          50: "#ecfdfd",
          100: "#cff8f8",
          200: "#a3eef0",
          300: "#67dfe3",
          400: "#27c6cd",
          500: "#0ea5b3",
          600: "#0c8593",
          700: "#106a77",
          800: "#155561",
          900: "#164752"
        },
        sand: {
          50: "#fbf9f6",
          100: "#f5f0e8",
          200: "#ece2d2"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"]
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem"
      },
      boxShadow: {
        // One coherent, neutral (black-based) elevation scale.
        soft: "0 1px 2px rgba(7,7,8,0.05), 0 2px 8px rgba(7,7,8,0.05)",
        card: "0 2px 6px rgba(7,7,8,0.06), 0 14px 32px -16px rgba(7,7,8,0.22)",
        pop: "0 24px 60px -20px rgba(7,7,8,0.40)",
        // Floating controls / pills lifted off the canvas
        float: "0 4px 14px rgba(7,7,8,0.12), 0 1px 4px rgba(7,7,8,0.08)",
        // Brand-tinted glow for primary CTAs (used sparingly)
        glow: "0 12px 32px -10px rgba(255,56,92,0.50)"
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" }
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.92) translateY(8px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" }
        }
      },
      animation: {
        "fade-in": "fade-in 0.4s ease both",
        "pop-in": "pop-in 0.18s ease-out both",
        "scale-in": "scale-in 0.22s cubic-bezier(0.32,0.72,0,1) both"
      }
    }
  },
  plugins: []
};

export default config;
