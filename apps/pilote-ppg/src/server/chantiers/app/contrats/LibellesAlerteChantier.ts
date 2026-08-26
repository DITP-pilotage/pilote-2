export const LIBELLE_TAUX_NON_CALCULE =
  "Taux d'avancement non calculé(s) en raison d'indicateurs non renseignés";

export const LIBELLE_ABSENCE_TAUX_DEPARTEMENTAL =
  "Chantier(s) sans taux d'avancement au niveau départemental";

export const LIBELLE_METEO_SYNTHESE_NON_RENSEIGNEES =
  "Chantier(s) avec météo et synthèse des résultats non renseignés";

export const LIBELLE_PROPOSITION_VALEUR_AVANCEMENT =
  "Chantier(s) avec proposition(s) de valeur d'avancement";

export const LIBELLE_TENDANCE_BAISSE = "Chantier(s) avec tendance en baisse";

export const libelleRetardMediane = (mailleAdjectif: string): string =>
  `Chantier(s) avec un retard de 10 points par rapport à leur médiane ${mailleAdjectif}`;
