const plugin = require("tailwindcss/plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./theme.config.*.tsx", // Pour le thème Nextra
  ],
  darkMode: false,
  theme: {
    extend: {
      colors: {
        // Le même que dsfr-blue-france-sun-113 car c'est le bleu marianne principal qu'on utilise presque partout
        primary: "#000091",
        error: "#CE0500",
        success: "#18753C",
        warning: "#B34000",
        "pilote-yellow": "#F9B233",
        "dsfr-info-main-525": "#0078F3",
        "dsfr-info-950": "#E8EDFF",
        "dsfr-warning-950": "#FFE9E6",
        "dsfr-warning-425": "#B34000",
        "dsfr-success-425": "#18753C",
        "dsfr-error-425": "#CE0500",
        "dsfr-moutarde-main-679": "#C3992A",
        "dsfr-moutarde-main-975": "#FEF5E8",
        "dsfr-grey-200": "#3A3A3A",
        "dsfr-grey-625": "#929292",
        "dsfr-grey-925": "#E5E5E5",
        "dsfr-mention-grey": "#666",
        "dsfr-contrast-grey": "#EEE",
        "dsfr-alt-blue-france": "#F5F5FE",
        "dsfr-blue-france-850": "#CACAFB",
        "dsfr-blue-france-925": "#E3E3FD",
        "dsfr-blue-france-925-hover": "#C1C1FB",
        "dsfr-blue-france-525": "#6A6AF4",
        "dsfr-blue-france-sun-113": "#000091",
        "dsfr-blue-link": "#5493EF",
        "dsfr-grey-50": "#161616",
        "dsfr-grey-1000": "#F6F6F6",
        "dsfr-green-bourgeon-main-640": "#68A532",
        "dsfr-green-bourgeon-975": "#E6FEDA",
        "dsfr-green-menthe-main-548": "#009081",
        "dsfr-green-menthe-975": "#DFFDF7",
        "dsfr-green-emeraude-main-632": "#00A95F",
        "dsfr-green-emeraude-975": "#E3FDEB",
      },
      keyframes: {
        "dropdown-fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "dropdown-fade-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(8px)" },
        },
        "accordion-open": {
          "0%": { height: "0", opacity: "0" },
          "100%": {
            height: "var(--radix-accordion-content-height)",
            opacity: "1",
          },
        },
        "accordion-close": {
          "0%": {
            height: "var(--radix-accordion-content-height)",
            opacity: "1",
          },
          "100%": { height: "0", opacity: "0" },
        },
      },
      animation: {
        "dropdown-fade-in": "dropdown-fade-in 150ms ease-out",
        "dropdown-fade-out": "dropdown-fade-out 150ms ease-in",
        "accordion-open": "accordion-open 200ms ease-out",
        "accordion-close": "accordion-close 200ms ease-in",
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("children", "& > *");
    }),
  ],
};
