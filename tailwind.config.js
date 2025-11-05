/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Le même que dsfr-blue-france-sun-113 car c'est le bleu marianne principal qu'on utilise presque partout
        primary: "#000091",
        error: "#CE0500",
        success: "#18753C",
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
        "dsfr-grey-50": "#161616",
        "dsfr-grey-1000": "#F6F6F6",
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
      },
      animation: {
        "dropdown-fade-in": "dropdown-fade-in 150ms ease-out",
        "dropdown-fade-out": "dropdown-fade-out 150ms ease-in",
      },
    },
  },
  plugins: [],
};
