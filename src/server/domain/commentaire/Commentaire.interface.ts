export type Commentaire = {
  id: string
  contenu: string
  date: string
  auteur: string
  type: TypeCommentaire
} | null;

//TODO renommer typesCommentaire
export const typesCommentaire = ['autresRésultatsObtenus', 'risquesEtFreinsÀLever', 'solutionsEtActionsÀVenir', 'exemplesConcretsDeRéussite'] as const;

export type TypeCommentaire = typeof typesCommentaire[number];

export type Commentaires = Record<TypeCommentaire, Commentaire>;
