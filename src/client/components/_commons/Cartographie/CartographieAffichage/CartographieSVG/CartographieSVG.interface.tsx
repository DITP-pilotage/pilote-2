import { Territoire, TracéRégion } from '@/components/_commons/Cartographie/Cartographie.interface';

export type Viewbox = {
  x: number,
  y: number,
  width: number,
  height: number,
};

export default interface CartographieSVGProps {
  tracésTerritoires: TracéRégion[],
  setTerritoireSurvolé:  (state: Territoire | null) => void
}
