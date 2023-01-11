import {
  CartographieBulleTerritoire,
  CartographieTerritoire,
} from '@/components/_commons/Cartographie/CartographieAffichage/CartographieAffichage.interface';

export type Viewbox = {
  x: number,
  y: number,
  width: number,
  height: number,
};

export type CartographieNuancier = {
  seuil: number,
  couleur: string
}[];

export default interface CartographieSVGProps {
  nuancier: CartographieNuancier,
  territoires: CartographieTerritoire[],
  setTerritoireSurvolé:  (state: CartographieBulleTerritoire | null) => void
}
