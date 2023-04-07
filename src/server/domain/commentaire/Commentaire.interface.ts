export type Commentaire = {
  id: string
  contenu: string
  date: string
  auteur: string
  type: TypeCommentaire
} | null;

//TODO renommer typesCommentaire
export const typeCommentaire = ['freinsÀLever', 'actionsÀVenir', 'actionsÀValoriser', 'autresRésultatsObtenus'] as const;
export type TypeCommentaire = typeof typeCommentaire[number];

export type Commentaires = Record<TypeCommentaire, Commentaire>;
