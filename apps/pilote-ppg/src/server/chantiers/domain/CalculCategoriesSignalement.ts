import {
  LIBELLE_ABSENCE_TAUX_DEPARTEMENTAL,
  LIBELLE_METEO_SYNTHESE_NON_RENSEIGNEES,
  LIBELLE_PROPOSITION_VALEUR_AVANCEMENT,
  LIBELLE_TAUX_NON_CALCULE,
  LIBELLE_TENDANCE_BAISSE,
  libelleRetardMediane,
} from "@/server/chantiers/app/contrats/LibellesAlerteChantier";

export const CATEGORIES_SIGNALEMENT = [
  "taux_avancement_non_calcule",
  "absence_taux_avancement_departemental",
  "meteo_synthese_non_renseignees",
  "proposition_valeur_avancement",
  "retard_mediane",
  "tendance_baisse",
] as const;

export type CategorieSignalement = (typeof CATEGORIES_SIGNALEMENT)[number];

const CATEGORIES_NATIONALES: CategorieSignalement[] = [
  "taux_avancement_non_calcule",
  "absence_taux_avancement_departemental",
  "meteo_synthese_non_renseignees",
  "proposition_valeur_avancement",
];

const CATEGORIES_TERRITORIALES: CategorieSignalement[] = [
  "retard_mediane",
  "tendance_baisse",
  "meteo_synthese_non_renseignees",
  "proposition_valeur_avancement",
];

export function categoriesApplicables(maille: string): CategorieSignalement[] {
  return maille === "NAT" ? CATEGORIES_NATIONALES : CATEGORIES_TERRITORIALES;
}

export function nomCategorie(categorie: CategorieSignalement): string {
  const noms: Record<CategorieSignalement, string> = {
    taux_avancement_non_calcule: "Taux d'avancement non calculé",
    absence_taux_avancement_departemental:
      "Absence de taux d'avancement départemental",
    meteo_synthese_non_renseignees: "Météo et synthèse non renseignées",
    proposition_valeur_avancement: "Proposition de valeur d'avancement",
    retard_mediane: "Retard par rapport à la médiane",
    tendance_baisse: "Tendance en baisse",
  };
  return noms[categorie];
}

export function libelleCategorieSignalement(
  categorie: CategorieSignalement,
  maille: string,
): string {
  switch (categorie) {
    case "taux_avancement_non_calcule":
      return LIBELLE_TAUX_NON_CALCULE;
    case "absence_taux_avancement_departemental":
      return LIBELLE_ABSENCE_TAUX_DEPARTEMENTAL;
    case "meteo_synthese_non_renseignees":
      return LIBELLE_METEO_SYNTHESE_NON_RENSEIGNEES;
    case "proposition_valeur_avancement":
      return LIBELLE_PROPOSITION_VALEUR_AVANCEMENT;
    case "retard_mediane":
      return libelleRetardMediane(
        maille === "REG" ? "régionale" : "départementale",
      );
    case "tendance_baisse":
      return LIBELLE_TENDANCE_BAISSE;
  }
}

export type ChantierTerritoireAvecJalon = {
  id: string;
  meteo: string | null;
  tendance: string | null;
  nombre_propositions_valeur_actuelle: number;
  chantier_identite: { cible_attendue: boolean };
  chantier_territoire_jalon: {
    ecart: number | null;
    taux_avancement: number | null;
  }[];
};

export function categoriesDuChantier(
  ct: ChantierTerritoireAvecJalon,
  maille: string,
  pvaChantierIds: ReadonlySet<string>,
  sansTauxDepartementalIds: ReadonlySet<string>,
): CategorieSignalement[] {
  const applicables = categoriesApplicables(maille);
  const jalonData = ct.chantier_territoire_jalon[0];
  const categories: CategorieSignalement[] = [];

  if (
    applicables.includes("taux_avancement_non_calcule") &&
    ct.chantier_identite.cible_attendue &&
    (jalonData?.taux_avancement === null ||
      jalonData?.taux_avancement === undefined)
  ) {
    categories.push("taux_avancement_non_calcule");
  }

  if (
    applicables.includes("absence_taux_avancement_departemental") &&
    sansTauxDepartementalIds.has(ct.id)
  ) {
    categories.push("absence_taux_avancement_departemental");
  }

  if (
    applicables.includes("meteo_synthese_non_renseignees") &&
    (ct.meteo === "NON_RENSEIGNEE" || ct.meteo === null)
  ) {
    categories.push("meteo_synthese_non_renseignees");
  }

  if (applicables.includes("proposition_valeur_avancement")) {
    const possedeUnePva =
      maille === "DEPT"
        ? ct.nombre_propositions_valeur_actuelle > 0
        : pvaChantierIds.has(ct.id);
    if (possedeUnePva) categories.push("proposition_valeur_avancement");
  }

  if (
    applicables.includes("retard_mediane") &&
    jalonData?.ecart !== null &&
    jalonData?.ecart !== undefined &&
    jalonData.ecart < -10
  ) {
    categories.push("retard_mediane");
  }

  if (applicables.includes("tendance_baisse") && ct.tendance === "BAISSE") {
    categories.push("tendance_baisse");
  }

  return categories;
}
