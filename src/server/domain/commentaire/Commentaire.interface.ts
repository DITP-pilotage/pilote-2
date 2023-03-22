import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export type DétailsCommentaire = {
  contenu: string
  date: string
  auteur: string
};

export const typeCommentaire = ['freinsÀLever', 'actionsÀVenir', 'actionsÀValoriser', 'autresRésultatsObtenus'] as const;
export type TypeCommentaire = typeof typeCommentaire[number];


export type Commentaires = Record<TypeCommentaire, DétailsCommentaire | null>;

export const commentairesNull = {
  freinsÀLever: null,
  actionsÀVenir: null,
  actionsÀValoriser: null,
  autresRésultatsObtenus: null,
};

export type NouveauCommentaire = {
  typeCommentaire: TypeCommentaire
  maille: Maille
  codeInsee: CodeInsee
  détailsCommentaire: DétailsCommentaire
};
