// Décrit le calcul dbt `compute_vaca` : la valeur d'avancement affichée dans
// PILOTE (courbe, tableau) est la VACA, calculée à partir des valeurs importées
// selon le paramétrage du TA annuel (param_vaca_*).
export type ParametrageValeurAffichee = {
  decumulFrom: string;
  partitionDate: string;
  operation: string;
};

const EXPLICATION_PARAMETRAGE_NON_RECONNU =
  "La valeur affichée dans PILOTE est calculée à partir des valeurs importées selon le paramétrage de l'indicateur : elle peut en différer.";

const PAS_DE_TRAITEMENT = "_";

const DECUMUL: Record<string, string> = {
  from_year_start:
    "Les valeurs importées sont cumulées depuis janvier : PILOTE retire de chaque valeur importée la valeur importée précédente de la même année, la première valeur de l'année étant conservée telle quelle.",
  from_beginning:
    "Les valeurs importées sont cumulées depuis le début : PILOTE retire de chaque valeur importée la valeur importée précédente, la première valeur étant conservée telle quelle.",
};

const SANS_CUMUL =
  "La valeur affichée dans PILOTE est la valeur ainsi décumulée.";

const CUMUL: Record<string, (valeurs: string) => string> = {
  from_year_start: (valeurs) =>
    `La valeur affichée dans PILOTE est la somme des valeurs ${valeurs} depuis janvier de l'année, jusqu'à la date de la valeur.`,
  from_beginning: (valeurs) =>
    `La valeur affichée dans PILOTE est la somme de toutes les valeurs ${valeurs} jusqu'à la date de la valeur.`,
  "from_previous_month::12": (valeurs) =>
    `La valeur affichée dans PILOTE est la somme des valeurs ${valeurs} des 12 derniers mois, mois de la valeur compris.`,
};

export function expliquerConstructionValeurAffichee(
  parametrage: ParametrageValeurAffichee | null,
): string | null {
  if (!parametrage) return null;

  const { decumulFrom, partitionDate, operation } = parametrage;
  // Comme dans dbt, `current_value` renvoie la valeur décumulée sans la cumuler
  const cumul =
    operation === "current_value" ? PAS_DE_TRAITEMENT : partitionDate;

  // Décumuler puis recumuler sur la même fenêtre redonne la valeur importée
  if (decumulFrom === cumul) return null;

  const estDecumulee = decumulFrom !== PAS_DE_TRAITEMENT;
  const descriptionDecumul = estDecumulee ? DECUMUL[decumulFrom] : "";
  const descriptionCumul =
    cumul === PAS_DE_TRAITEMENT
      ? SANS_CUMUL
      : CUMUL[cumul]?.(estDecumulee ? "décumulées" : "importées");

  if (descriptionDecumul === undefined || descriptionCumul === undefined) {
    return EXPLICATION_PARAMETRAGE_NON_RECONNU;
  }

  return estDecumulee
    ? `${descriptionDecumul} ${descriptionCumul}`
    : descriptionCumul;
}
