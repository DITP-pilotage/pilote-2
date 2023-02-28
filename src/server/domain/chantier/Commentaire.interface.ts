export type DetailsCommentaire = {
  contenu: string | null
  date: string | null
  auteur: string | null
};

export type TypeCommentaire = string;

export type Commentaires = Record<TypeCommentaire, DetailsCommentaire | null>;

