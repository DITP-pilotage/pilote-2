import {
  DépartementsType,
  RégionsType,
} from '@/components/_commons/Cartographie/Cartographie.interface';

export default interface CartographieAffichageProps {
  svgPaths: DépartementsType | RégionsType,
}
