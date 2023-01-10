import { CartographieFonctionDAffichage } from '@/components/_commons/Cartographie/Cartographie.interface';

export type CartographieBulleTerritoire = Pick<CartographieTerritoire, 'codeInsee' | 'nom' | 'valeur'>;

export type CartographieTerritoireCodeInsee = string;

export type CartographieValeur = number | null;

export type CartographieTerritoire = {
  codeInsee: CartographieTerritoireCodeInsee,
  nom: string,
  sousTerritoires: (CartographieTerritoire & {
    codeInseeParent: CartographieTerritoireCodeInsee;
  })[];
  tracéSVG: string;
  valeur: CartographieValeur,
};

export default interface CartographieAffichageProps {
  fonctionDAffichage: CartographieFonctionDAffichage
  territoires: CartographieTerritoire[]
}
