import type { FilterDescriptor } from "@/components/shared/DataTable/types";

export type StatutReferentiel = "ACTIF" | "SUPPRIME";

export const statutReferentielDe = (
  deletedAt: string | null,
): StatutReferentiel => (deletedAt === null ? "ACTIF" : "SUPPRIME");

export const CLASSE_COLONNE_ID = "font-mono text-xs text-gray-400";
export const CLASSE_COLONNE_NOM = "font-medium text-gray-900";
export const CLASSE_COLONNE_SECONDAIRE = "text-xs text-gray-500";
export const CLASSE_COLONNE_DATE = "text-xs text-gray-500 whitespace-nowrap";

export const OPTIONS_STATUT_REFERENTIEL: {
  valeur: StatutReferentiel;
  label: string;
}[] = [
  { valeur: "ACTIF", label: "Actif" },
  { valeur: "SUPPRIME", label: "Supprimé" },
];

export const FILTRE_STATUT_REFERENTIEL = {
  param: "statut",
  columnId: "statut",
  default: ["ACTIF"],
};

export const filtreStatutReferentiel = {
  type: "checkboxes",
  label: "Statut :",
  options: OPTIONS_STATUT_REFERENTIEL.map((option) => ({
    value: option.valeur,
    label: option.label,
  })),
} as const satisfies FilterDescriptor;
