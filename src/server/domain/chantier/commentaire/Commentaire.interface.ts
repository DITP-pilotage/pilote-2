export type Commentaire = {
  id: string;
  contenu: string;
  date: string;
  auteur: string;
  type: TypeCommentaireChantier;
} | null;

export type CommentaireV2 = {
  chantierId: string;
  territoireCode: string;
  id: string;
  contenu: string;
  auteur_id: string;
  type: TypeCommentaireChantier;
  date: Date;
};

export const typesCommentaireMailleNationale = [
  "autresRésultatsObtenusNonCorrélésAuxIndicateurs",
  "risquesEtFreinsÀLever",
  "solutionsEtActionsÀVenir",
  "exemplesConcretsDeRéussite",
] as const;
export const typesCommentaireMailleRégionaleOuDépartementale = [
  "commentairesSurLesDonnées",
  "autresRésultatsObtenus",
] as const;

export type TypeCommentaireMailleNationale =
  (typeof typesCommentaireMailleNationale)[number];
export type TypeCommentaireMailleRégionaleOuDépartementale =
  (typeof typesCommentaireMailleRégionaleOuDépartementale)[number];
export type TypeCommentaireChantier =
  | TypeCommentaireMailleNationale
  | TypeCommentaireMailleRégionaleOuDépartementale;
