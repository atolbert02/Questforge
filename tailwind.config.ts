import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: "#05060e",
          card: "#0d1117",
          hover: "#131a26",
        },
        border: "#1a2535",
        accent: {
          orange: "#f97316",
          cyan: "#22d3ee",
          green: "#4ade80",
          purple: "#a78bfa",
          amber: "#fbbf24",
          pink: "#fb7185",
        },
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
        body: ["DM Sans", "sans-serif"],
      },
      keyframes: {
        bossGlow: {
          "0%, 100%": { boxShadow: "0 0 8px #f97316" },
          "50%": { boxShadow: "0 0 24px #f97316, 0 0 48px #f9731644" },
        },
      },
      animation: {
        bossGlow: "bossGlow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
