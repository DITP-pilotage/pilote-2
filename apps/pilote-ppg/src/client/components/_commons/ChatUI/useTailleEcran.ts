import { useSyncExternalStore } from "react";
import type { TailleEcran } from "@/components/_commons/ChatUI/affichageAssistant";

// Points de rupture lg (992 px) et xl (1440 px) du DSFR.
const REQUETE_ECRAN_MOYEN = "(min-width: 62em)";
const REQUETE_ECRAN_LARGE = "(min-width: 90em)";

const abonner = (onChange: () => void) => {
  const medias = [REQUETE_ECRAN_MOYEN, REQUETE_ECRAN_LARGE].map((requete) =>
    window.matchMedia(requete),
  );
  medias.forEach((media) => media.addEventListener("change", onChange));
  return () =>
    medias.forEach((media) => media.removeEventListener("change", onChange));
};

const lire = (): TailleEcran => {
  if (window.matchMedia(REQUETE_ECRAN_LARGE).matches) return "large";
  if (window.matchMedia(REQUETE_ECRAN_MOYEN).matches) return "moyenne";
  return "etroite";
};

export const useTailleEcran = (): TailleEcran =>
  useSyncExternalStore(abonner, lire, () => "etroite");
