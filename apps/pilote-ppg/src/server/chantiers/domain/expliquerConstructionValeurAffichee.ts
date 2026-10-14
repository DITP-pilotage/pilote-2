// Traduit le paramétrage du TA annuel (param_vaca_*) appliqué par le calcul
// dbt `compute_vaca` : la valeur d'avancement affichée dans PILOTE (courbe,
// tableau) est la VACA, calculée à partir des valeurs importées.
export type ParametrageValeurAffichee = {
  decumulFrom: string | null;
  partitionDate: string | null;
  operation: string | null;
};

const EXPLICATION_PARAMETRAGE_NON_RECONNU =
  "La valeur affichée dans PILOTE est calculée à partir des valeurs importées selon le paramétrage de l'indicateur : elle peut en différer.";

const PAS_DE_TRAITEMENT = "_";
const DEPUIS_DEBUT_ANNEE = "from_year_start";
const PREFIXE_DEPUIS_DATE = "from_custom_date::";
const PREFIXE_MOIS_GLISSANTS = "from_previous_month::";

const IMPORT_PAR_DECUMUL: Record<string, string> = {
  [PAS_DE_TRAITEMENT]: "Les valeurs sont importées mois par mois.",
  [DEPUIS_DEBUT_ANNEE]:
    "Les valeurs sont importées déjà cumulées depuis janvier de l'année.",
};

const OPERATION_PAR_CODE: Record<string, string> = {
  sum: "la somme",
  avg: "la moyenne",
  moy: "la moyenne",
};

function decrireImport(decumulFrom: string | null): string | null {
  if (decumulFrom === null) return null;
  if (decumulFrom.startsWith(PREFIXE_DEPUIS_DATE)) {
    return "Les valeurs sont importées déjà cumulées depuis le début.";
  }
  return IMPORT_PAR_DECUMUL[decumulFrom] ?? null;
}

function decrireFenetreCumul(partitionDate: string): string | null {
  if (partitionDate === DEPUIS_DEBUT_ANNEE) return "depuis janvier de l'année";
  if (partitionDate.startsWith(PREFIXE_DEPUIS_DATE)) return "depuis le début";
  if (partitionDate.startsWith(PREFIXE_MOIS_GLISSANTS)) {
    const nombreMois = partitionDate.slice(PREFIXE_MOIS_GLISSANTS.length);
    return /^\d+$/.test(nombreMois)
      ? `sur les ${nombreMois} derniers mois glissants`
      : null;
  }
  return null;
}

export function expliquerConstructionValeurAffichee(
  parametrage: ParametrageValeurAffichee | null,
): string | null {
  if (!parametrage) return null;

  const { decumulFrom, partitionDate, operation } = parametrage;
  const descriptionImport = decrireImport(decumulFrom);
  if (!descriptionImport || partitionDate === null) {
    return EXPLICATION_PARAMETRAGE_NON_RECONNU;
  }

  const estDecumulee = decumulFrom !== PAS_DE_TRAITEMENT;

  if (operation === "current_value" || partitionDate === PAS_DE_TRAITEMENT) {
    return estDecumulee
      ? `${descriptionImport} La valeur affichée dans PILOTE est la valeur du seul mois, obtenue en retirant de la valeur importée celle du mois précédent.`
      : null;
  }

  // Décumuler puis recumuler sur la même fenêtre redonne la valeur importée
  if (estDecumulee && decumulFrom === partitionDate && operation === "sum") {
    return null;
  }

  const descriptionOperation = operation ? OPERATION_PAR_CODE[operation] : null;
  const fenetreCumul = decrireFenetreCumul(partitionDate);
  if (!descriptionOperation || !fenetreCumul) {
    return EXPLICATION_PARAMETRAGE_NON_RECONNU;
  }

  const precisionDecumul = estDecumulee
    ? ", les valeurs mensuelles étant obtenues en retirant de chaque valeur importée celle du mois précédent"
    : "";

  return `${descriptionImport} La valeur affichée dans PILOTE est ${descriptionOperation} des valeurs mensuelles ${fenetreCumul}${precisionDecumul}.`;
}
