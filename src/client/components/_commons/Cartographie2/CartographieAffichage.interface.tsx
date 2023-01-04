import {
  DépartementsType,
  RégionsType,
} from '@/components/_commons/Cartographie2/Cartographie.interface';

export default interface CartographieAffichageProps {
  svgPaths: DépartementsType | RégionsType,
}
