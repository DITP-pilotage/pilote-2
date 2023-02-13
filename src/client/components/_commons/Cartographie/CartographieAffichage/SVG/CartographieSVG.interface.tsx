import { CartographieBulleTerritoire, CartographieTerritoire, CartographieOptions } from '../../useCartographie';

export type Viewbox = {
  x: number,
  y: number,
  width: number,
  height: number,
};

export default interface CartographieSVGProps {
  options: CartographieOptions,
  territoires: CartographieTerritoire[],
  setTerritoireSurvolé:  (state: CartographieBulleTerritoire | null) => void
}
