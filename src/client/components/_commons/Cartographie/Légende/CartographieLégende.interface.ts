import { ReactNode } from 'react';
import { CouleurHexa } from '@/client/utils/couleur/couleur.interface';

export type Remplissage = CouleurHexa | `url(#${string})`;

export type CartographieÉlémentDeLégende = {
  libellé: string,
  picto?: ReactNode,
  remplissage: Remplissage,
};

export type CartographieÉlémentsDeLégende = Record<string, CartographieÉlémentDeLégende>;


