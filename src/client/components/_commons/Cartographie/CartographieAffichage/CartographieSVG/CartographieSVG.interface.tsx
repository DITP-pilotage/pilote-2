import { Territoire, TracéTerritoire } from '@/components/_commons/Cartographie/Cartographie.interface';

export type Viewbox = {
  x: number,
  y: number,
  width: number,
  height: number,
};

export default interface CartographieSVGProps {
  tracésTerritoires: TracéTerritoire[],
  setTerritoireSurvolé:  (state: Territoire | null) => void
}
