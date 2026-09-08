export const CATEGORIES_ALERTE_CHANTIER = [
  { categorie: "ecart", typeAlerte: "estEnAlerteÉcart" },
  { categorie: "baisse", typeAlerte: "estEnAlerteBaisse" },
  {
    categorie: "taux_non_calcule",
    typeAlerte: "estEnAlerteTauxAvancementNonCalculé",
  },
  {
    categorie: "absence_taux_departemental",
    typeAlerte: "estEnAlerteAbscenceTauxAvancementDepartemental",
  },
  {
    categorie: "meteo_non_renseignee",
    typeAlerte: "estEnAlerteMétéoNonRenseignée",
  },
  {
    categorie: "pva",
    typeAlerte: "estEnAlertePossedePropositionsValeurAvancement",
  },
] as const;

export type CategorieAlerteChantier =
  (typeof CATEGORIES_ALERTE_CHANTIER)[number]["categorie"];
