import {
  CartographieOptions,
  CartographieTerritoires,
  CartographieInfoBulle,
} from '@/components/_commons/Cartographie/useCartographie.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export type Viewbox = {
  x: number,
  y: number,
  width: number,
  height: number,
};

export default interface CartographieSVGProps {
  options: CartographieOptions,
  territoires: CartographieTerritoires['territoires'],
  frontières: CartographieTerritoires['frontières'],
  setInfoBulle:  (state: CartographieInfoBulle | null) => void,
  auClicTerritoireCallback: (territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) => void,
  estInteractif: boolean
}
