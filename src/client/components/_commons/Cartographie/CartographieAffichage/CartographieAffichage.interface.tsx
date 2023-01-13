import { ReactNode } from 'react';
import { CartographieOptions } from '@/components/_commons/Cartographie/Cartographie.interface';

export type CartographieBulleTerritoire = Pick<CartographieTerritoire, 'codeInsee' | 'nom' | 'valeur' | 'divisionAdministrative'>;

export type CartographieTerritoireCodeInsee = string;

export type CartographieValeur = number | null;

export type CartographieTerritoire = {
  codeInsee: CartographieTerritoireCodeInsee,
  divisionAdministrative: 'france' | 'région' | 'département',
  nom: string,
  sousTerritoires: (CartographieTerritoire & {
    codeInseeParent: CartographieTerritoireCodeInsee;
  })[];
  tracéSVG: string;
  valeur: CartographieValeur,
};

export default interface CartographieAffichageProps {
  children: ReactNode,
  options: CartographieOptions,
  territoires: CartographieTerritoire[],
}
