import type { ParametrageValeurAffichee } from "@/server/chantiers/query/GetIndicateurContexteQuery";

const EXPLICATION_PARAMETRAGE_NON_RECONNU =
  "La valeur affichée dans PILOTE est calculée à partir des valeurs importées selon le paramétrage de l'indicateur : elle peut en différer.";

const PAS_DE_TRAITEMENT = "_";

const DECUMUL: Record<string, string> = {
  from_year_start:
    "Les valeurs importées sont cumulées depuis janvier : PILOTE retire de chaque valeur importée la valeur importée précédente de la même année, la première valeur de l'année étant conservée telle quelle.",
  from_beginning:
    "Les valeurs importées sont cumulées depuis la première valeur : PILOTE retire de chaque valeur importée la valeur importée précédente, la première valeur importée étant conservée telle quelle.",
};

const DECUMUL_SANS_CUMUL =
  "La valeur affichée dans PILOTE est la valeur ainsi décumulée.";

const CUMUL: Record<
  string,
  (typeValeurs: "importées" | "décumulées") => string
> = {
  from_year_start: (typeValeurs) =>
    `La valeur affichée dans PILOTE est la somme des valeurs ${typeValeurs} depuis janvier de l'année, jusqu'à la date de la valeur.`,
  from_beginning: (typeValeurs) =>
    `La valeur affichée dans PILOTE est la somme de toutes les valeurs ${typeValeurs} jusqu'à la date de la valeur.`,
  "from_previous_month::12": (typeValeurs) =>
    `La valeur affichée dans PILOTE est la somme des valeurs ${typeValeurs} des 12 derniers mois, mois de la valeur compris.`,
};

// Décrit le calcul dbt `compute_vaca` : la valeur d'avancement affichée dans
// PILOTE (courbe, tableau) est la VACA, calculée à partir des valeurs importées
// selon le paramétrage du TA annuel (param_vaca_*).
export function expliquerConstructionValeurAffichee(
  parametrage: ParametrageValeurAffichee | null,
): string | null {
  if (!parametrage) return null;

  const { decumul, cumul } = parametrage;

  // Décumuler puis recumuler sur la même fenêtre redonne la valeur importée
  if (decumul === cumul) return null;

  const estDecumulee = decumul !== PAS_DE_TRAITEMENT;
  const descriptionDecumul = estDecumulee ? DECUMUL[decumul] : "";
  const descriptionCumul =
    cumul === PAS_DE_TRAITEMENT
      ? DECUMUL_SANS_CUMUL
      : CUMUL[cumul]?.(estDecumulee ? "décumulées" : "importées");

  if (descriptionDecumul === undefined || descriptionCumul === undefined) {
    return EXPLICATION_PARAMETRAGE_NON_RECONNU;
  }

  return estDecumulee
    ? `${descriptionDecumul} ${descriptionCumul}`
    : descriptionCumul;
}
