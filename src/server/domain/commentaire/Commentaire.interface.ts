export type Commentaire = {
  id: string
  contenu: string
  date: string
  auteur: string
  type: TypeCommentaire
} | null;

export const typesCommentaireMailleNationale = ['autresRésultatsObtenusNonCorrélésAuxIndicateurs', 'risquesEtFreinsÀLever', 'solutionsEtActionsÀVenir', 'exemplesConcretsDeRéussite'] as const;
export const typesCommentaireMailleRégionaleOuDépartementale = ['commentairesSurLesDonnées', 'autresRésultatsObtenus'] as const;

export type TypeCommentaireMailleNationale = typeof typesCommentaireMailleNationale[number];
export type TypeCommentaireMailleRégionaleOuDépartementale = typeof typesCommentaireMailleRégionaleOuDépartementale[number];
export type TypeCommentaire = TypeCommentaireMailleNationale | TypeCommentaireMailleRégionaleOuDépartementale;

export type CommentairesMailleNationale = Record<TypeCommentaireMailleNationale, Commentaire>;
export type CommentairesMailleRégionaleOuDépartementale = Record<TypeCommentaireMailleRégionaleOuDépartementale, Commentaire>;
export type Commentaires = CommentairesMailleNationale | CommentairesMailleRégionaleOuDépartementale;
