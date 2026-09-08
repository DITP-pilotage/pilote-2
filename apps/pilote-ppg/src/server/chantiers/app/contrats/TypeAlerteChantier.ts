export const TYPES_ALERTE_CHANTIER = [
  "estEnAlerteÉcart",
  "estEnAlerteBaisse",
  "estEnAlerteTauxAvancementNonCalculé",
  "estEnAlerteAbscenceTauxAvancementDepartemental",
  "estEnAlerteMétéoNonRenseignée",
  "estEnAlertePossedePropositionsValeurAvancement",
] as const;

export type TypeAlerteChantier = (typeof TYPES_ALERTE_CHANTIER)[number];
