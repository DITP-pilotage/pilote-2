export type DetailsCommentaire = {
  contenu: string | null
  date: string | null
  auteur: string | null
};

export const typeCommentaire = ['freinsÀLever', 'actionsÀVenir', 'actionsÀValoriser', 'autresRésultatsObtenus'] as const;
export type TypeCommentaire = typeof typeCommentaire[number];


export type Commentaires = Record<TypeCommentaire, DetailsCommentaire | null>;

export const commentairesNull = {
  freinsÀLever: {
    contenu: null,
    date: null,
    auteur: null,
  },
  actionsÀVenir: {
    contenu: null,
    date: null,
    auteur: null,
  },
  actionsÀValoriser: {
    contenu: null,
    date: null,
    auteur: null,
  },
  autresRésultatsObtenus: {
    contenu: null,
    date: null,
    auteur: null,
  },
};
