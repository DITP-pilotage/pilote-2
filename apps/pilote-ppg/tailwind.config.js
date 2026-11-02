const plugin = require("tailwindcss/plugin");
const couleurs = require("./tailwind.colors.js");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: false,
  important: true,
  theme: {
    // Points de rupture du DSFR 1.15.2 (36 / 48 / 62 / 78 em).
    screens: {
      sm: "36em",
      md: "48em",
      lg: "62em",
      xl: "78em",
      "2xl": "96em",
    },
    extend: {
      fontFamily: {
        sans: ["Marianne", "arial", "sans-serif"],
      },
      // Échelle de texte (`fr-text--*`) et titres (`fr-h*`, mobile puis ≥ md) du DSFR 1.15.2.
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.25rem" }],
        sm: ["0.875rem", { lineHeight: "1.5rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        lead: ["1.25rem", { lineHeight: "2rem" }],
        h1: ["2rem", { lineHeight: "2.5rem", fontWeight: "700" }],
        h2: ["1.75rem", { lineHeight: "2.25rem", fontWeight: "700" }],
        h3: ["1.5rem", { lineHeight: "2rem", fontWeight: "700" }],
        h4: ["1.375rem", { lineHeight: "1.75rem", fontWeight: "700" }],
        h5: ["1.25rem", { lineHeight: "1.75rem", fontWeight: "700" }],
        h6: ["1.125rem", { lineHeight: "1.5rem", fontWeight: "700" }],
        "h1-md": ["2.5rem", { lineHeight: "3rem", fontWeight: "700" }],
        "h2-md": ["2rem", { lineHeight: "2.5rem", fontWeight: "700" }],
        "h3-md": ["1.75rem", { lineHeight: "2.25rem", fontWeight: "700" }],
        "h4-md": ["1.5rem", { lineHeight: "2rem", fontWeight: "700" }],
        "h5-md": ["1.375rem", { lineHeight: "1.75rem", fontWeight: "700" }],
        "h6-md": ["1.25rem", { lineHeight: "1.75rem", fontWeight: "700" }],
      },
      boxShadow: {
        "dsfr-raised": "0 1px 3px rgba(0, 0, 18, 0.16)",
        "dsfr-overlap": "0 2px 6px rgba(0, 0, 18, 0.16)",
        "dsfr-lifted": "0 3px 9px rgba(0, 0, 18, 0.16)",
      },
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
