export type DétailsCommentaire = {
  contenu: string
  date: string
  auteur: string
};

export const typeCommentaire = ['freinsÀLever', 'actionsÀVenir', 'actionsÀValoriser', 'autresRésultatsObtenus'];
export type TypeCommentaire = typeof typeCommentaire[number];


export type Commentaires = Record<TypeCommentaire, DétailsCommentaire | null>;

export const commentairesNull = {
  freinsÀLever: null,
  actionsÀVenir: null,
  actionsÀValoriser: null,
  autresRésultatsObtenus: null,
};
