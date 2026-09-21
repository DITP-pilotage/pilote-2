import type { ConfigFiltreColonne } from "./useEtatTableauAdmin";

export type StatutReferentiel = "ACTIF" | "SUPPRIME";

export const statutReferentielDe = (
  deletedAt: string | null,
): StatutReferentiel => (deletedAt === null ? "ACTIF" : "SUPPRIME");

export const OPTIONS_STATUT_REFERENTIEL: {
  valeur: StatutReferentiel;
  label: string;
}[] = [
  { valeur: "ACTIF", label: "Actif" },
  { valeur: "SUPPRIME", label: "Supprimé" },
];

export const FILTRE_STATUT_REFERENTIEL: ConfigFiltreColonne = {
  parametre: "statut",
  colonneId: "statut",
  valeursParDefaut: ["ACTIF"],
};
