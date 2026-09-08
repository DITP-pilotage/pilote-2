export const CATEGORIES_LOG = {
  albert: "Albert",
  auth: "Authentification",
  chantier: "Chantiers",
  contenu: "Contenus éditoriaux",
  evaluation: "Évaluations",
  import: "Imports de données",
  indicateur: "Indicateurs",
  maintenance: "Maintenance et purges",
  notification: "Notifications Tchap",
  pva: "Propositions de valeur d'avancement",
  rapport: "Rapports hebdomadaires",
  referentiel: "Référentiels et métadonnées",
  "responsables-donnees": "Responsables de données",
  sync: "Synchronisation kpilote",
  systeme: "Système",
  utilisateur: "Utilisateurs",
} as const;

export type CategorieLog = keyof typeof CATEGORIES_LOG;

export const CATEGORIE_LOG_PAR_DEFAUT: CategorieLog = "systeme";

export function libelleCategorieLog(categorie: string): string {
  return CATEGORIES_LOG[categorie as CategorieLog] ?? categorie;
}
