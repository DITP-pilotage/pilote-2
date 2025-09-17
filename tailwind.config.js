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
        "dsfr-blue-france-925": "#e3e3fd",
        "dsfr-blue-france-925-hover": "#c1c1fb",
        "dsfr-blue-france-sun-113": "#000091",
        "dsfr-grey-50": "#161616",
        "dsfr-grey-1000": "#F6F6F6",
      },
    },
  },
  plugins: [],
};
