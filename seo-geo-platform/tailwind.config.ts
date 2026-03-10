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
        background: "var(--background)",
        foreground: "var(--foreground)",
        bg: "#080E17",
        "bg-soft": "#0D1520",
        card: "#141E2C",
        "card-alt": "#1A2738",
        accent: "#00E4B8",
        "accent-soft": "rgba(0,228,184,0.12)",
        warn: "#FF5C5C",
        "warn-soft": "rgba(255,92,92,0.12)",
        blue: "#4CA4FF",
        "blue-soft": "rgba(76,164,255,0.12)",
        orange: "#FFAA40",
        "orange-soft": "rgba(255,170,64,0.12)",
        purple: "#B07CFF",
        "purple-soft": "rgba(176,124,255,0.12)",
        green: "#3DD68C",
        "green-soft": "rgba(61,214,140,0.12)",
        text: "#F0F4F8",
        "text-mid": "#9BAABB",
        "text-dim": "#5C6F82",
        border: "#1E2D3D",
      },
      fontFamily: {
        sans: ["Noto Sans JP", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
