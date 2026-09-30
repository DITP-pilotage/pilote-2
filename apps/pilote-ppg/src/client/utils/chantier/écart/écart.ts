import type { VarianteBadge } from "@/components/shared/Badge";

type CouleurEcart = "rouge" | "bleu" | "vert" | "gris";

export const VARIANTE_BADGE_ECART: Record<CouleurEcart, VarianteBadge> = {
  rouge: "erreur",
  bleu: "info",
  vert: "succes",
  gris: "defaut",
};
type Avancement = "EN AVANCE" | "DANS LA MEDIANE" | "EN RETARD" | "ARCHIVE";

export function definirCouleurEcartArrondi(
  ecart: number | null,
  estArchive?: boolean,
) {
  if (ecart === null) return null;

  const ecartArrondi = +ecart.toFixed(1) || 0;
  const couleur: CouleurEcart = estArchive
    ? "gris"
    : ecartArrondi <= -10
      ? "rouge"
      : ecartArrondi >= 10
        ? "vert"
        : "bleu";
  const commentaire: Avancement = estArchive
    ? "ARCHIVE"
    : ecartArrondi <= -10
      ? "EN RETARD"
      : ecartArrondi >= 10
        ? "EN AVANCE"
        : "DANS LA MEDIANE";

  return { ecartArrondi, couleur, commentaire };
}
