import { ReactNode } from 'react';
import { CartographieOptions } from '@/components/_commons/Cartographie/Cartographie.interface';
import { Maille } from '@/server/domain/chantier/Chantier.interface';

export type CartographieBulleTerritoire = Pick<CartographieTerritoire, 'codeInsee' | 'nom' | 'valeur' | 'maille'>;
export type CartographieTerritoireCodeInsee = string;

export type CartographieValeur = number | string | null;

export type CartographieTerritoire = {
  codeInsee: CartographieTerritoireCodeInsee,
  maille: Maille,
  nom: string,
  sousTerritoires: (CartographieTerritoire & {
    codeInseeParent: CartographieTerritoireCodeInsee;
  })[];
  tracéSVG: string;
  valeur: CartographieValeur,
};

export default interface CartographieAffichageProps {
  children?: ReactNode,
  options: CartographieOptions,
  territoires: CartographieTerritoire[],
}
