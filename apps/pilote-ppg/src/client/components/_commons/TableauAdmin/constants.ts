import type { ConfigFiltreColonne } from "./useEtatTableauAdmin";
import type { StatutReferentiel } from "./utils";

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

export const FILTRE_STATUT_REFERENTIEL: ConfigFiltreColonne = {
  parametre: "statut",
  colonneId: "statut",
  valeursParDefaut: ["ACTIF"],
};
