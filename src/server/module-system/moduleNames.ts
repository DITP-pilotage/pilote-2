export const moduleNames = [
  "shared",
  "authentification",
  "chantiers",
  "parametrageIndicateur",
  "importIndicateur",
  "importCommentaire",
  "importDecisionStrategique",
  "importObjectif",
  "importSyntheseDesResultats",
  "gestionUtilisateur",
  "ficheConducteur",
  "parametrageNouveautes",
  "indicateurTerritoireValeurEvenement",
  "piloteEval",
  "habilitationsCoordinateur",
  "profilUtilisateur",
  "rapportsHebdomadaires",
  "albert",
  "parametrageCentreAide",
  "legacy",
] as const;

export type ModuleName = (typeof moduleNames)[number];
