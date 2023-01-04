import {
  DépartementsType,
  RégionsType,
} from '@/components/_commons/Cartographie/Cartographie.interface';

export type ViewboxType = {
  x: number,
  y: number,
  width: number,
  height: number,
};

export default interface CartographieSVGProps {
  svgPaths: DépartementsType | RégionsType,
}
