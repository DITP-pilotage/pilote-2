import { Territoire } from '@/components/_commons/Cartographie/Cartographie.interface';

export type ViewboxType = {
  x: number,
  y: number,
  width: number,
  height: number,
};

export default interface CartographieSVGProps {
  svgPaths: Territoire[],
  setTerritoireSurvolé:  (state: Partial<Territoire> | null) => void
}
