import {
  CartographieTerritoireSurvolé,
  CartographieOptions,
  CartographieTerritoires,
} from '@/components/_commons/Cartographie/useCartographie.interface';

export type Viewbox = {
  x: number,
  y: number,
  width: number,
  height: number,
};

export default interface CartographieSVGProps {
  options: CartographieOptions,
  territoires: CartographieTerritoires,
  setTerritoireSurvolé:  (state: CartographieTerritoireSurvolé | null) => void
}
