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

export default interface CartographieSVGProps {
  territoires: CartographieTerritoire[],
  setTerritoireSurvolé:  (state: CartographieBulleTerritoire | null) => void
}
