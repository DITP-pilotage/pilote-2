import { CartographieOptions } from '@/components/_commons/Cartographie/useCartographie.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export type CartographieDonnéesMétéo = { valeur: Météo, codeInsee: CodeInsee }[];

export default interface CartographieMétéoProps {
  données: CartographieDonnéesMétéo,
  options?: Partial<CartographieOptions>,
  auClicTerritoireCallback: (territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) => void
}
