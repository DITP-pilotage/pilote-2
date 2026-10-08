const plugin = require("tailwindcss/plugin");
const couleurs = require("./tailwind.colors.js");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: false,
  important: true,
  theme: {
    extend: {
      colors: couleurs,
      keyframes: {
        "dropdown-fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "dropdown-fade-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(8px)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pulse-recording": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "pulse-opacity": {
          "0%": { opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "cssload-width": {
          "0%": { width: "0" },
          "100%": { width: "100%" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(100%)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-square": {
          "0%, 100%": { opacity: "0.25" },
          "50%": { opacity: "1" },
        },
        "blink-caret": {
          "50%": { opacity: "0" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "dropdown-fade-in": "dropdown-fade-in 150ms ease-out",
        "dropdown-fade-out": "dropdown-fade-out 150ms ease-in forwards",
        "fade-in": "fade-in 300ms ease-out",
        "pulse-recording": "pulse-recording 1.5s ease-in-out infinite",
        "pulse-opacity": "pulse-opacity 2s ease-in-out infinite",
        "cssload-width": "cssload-width 1s ease-out 1",
        "slide-up": "slide-up 300ms ease-out",
        "pulse-square": "pulse-square 1.2s ease-in-out infinite",
        "blink-caret": "blink-caret 1s steps(2) infinite",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [
    plugin(({ addVariant, addBase }) => {
      addVariant("children", "& > *");
      addBase({
        "@media print": {
          "@page": {
            margin: "1.5cm 1cm",
          },
        },
      });
    }),
  ],
};
