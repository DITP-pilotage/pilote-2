export type Commentaire = {
  id: string
  contenu: string
  date: string
  auteur: string
  type: TypeCommentaireChantier
} | null;

export const typesCommentaireMailleNationale = ['autresRésultatsObtenusNonCorrélésAuxIndicateurs', 'risquesEtFreinsÀLever', 'solutionsEtActionsÀVenir', 'exemplesConcretsDeRéussite'] as const;
export const typesCommentaireMailleRégionaleOuDépartementale = ['commentairesSurLesDonnées', 'autresRésultatsObtenus'] as const;

export type TypeCommentaireMailleNationale = typeof typesCommentaireMailleNationale[number];
export type TypeCommentaireMailleRégionaleOuDépartementale = typeof typesCommentaireMailleRégionaleOuDépartementale[number];
export type TypeCommentaireChantier = TypeCommentaireMailleNationale | TypeCommentaireMailleRégionaleOuDépartementale;
