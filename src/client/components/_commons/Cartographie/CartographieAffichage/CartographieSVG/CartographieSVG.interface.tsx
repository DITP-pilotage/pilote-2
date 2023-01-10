import {
  Territoire,
  TracéRégion,
} from '@/components/_commons/Cartographie/CartographieAffichage/CartographieAffichage.interface';

export type Viewbox = {
  x: number,
  y: number,
  width: number,
  height: number,
};

export default interface CartographieSVGProps {
  tracésRégions: TracéRégion[],
  setTerritoireSurvolé:  (state: Territoire | null) => void
}
