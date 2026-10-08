import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Tailles de texte DSFR ajoutées au thème (tailwind.config.js) : sans cela,
// twMerge les prend pour des couleurs et les écarte face à une couleur de texte.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "lead",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "h1-md",
        "h2-md",
        "h3-md",
        "h4-md",
        "h5-md",
        "h6-md",
      ],
    },
  },
});

export const clsxm = (...classes: ClassValue[]) => twMerge(clsx(...classes));
