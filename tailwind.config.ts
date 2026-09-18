import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFFFFF",
        paper: "#F7F7F5",
        ink: "#20241F",
        inksoft: "#666B5F",
        line: "rgba(32,36,31,.14)",
        terracotta: "#C96A3C",
        teal: "#3F7F70",
        tealdeep: "#2C5C51",
        olive: "#8E9B5E",
        rose: "#C97F82",
        mint: "#7FE6B8",
        dark: "#132420",
      },
      fontFamily: {
        display: ["var(--font-instrument)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        pill: "100px",
      },
    },
  },
  plugins: [],
};
export default config;
