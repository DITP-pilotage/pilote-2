import { CartographieOptions } from '@/components/_commons/Cartographie/useCartographie.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { CartographieÉlémentsDeLégende } from '@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface';

export type CartographieDonnéesMétéo = { valeur: Météo, codeInsee: CodeInsee, estApplicable: boolean | null }[];

export default interface CartographieMétéoProps {
  données: CartographieDonnéesMétéo,
  options?: Partial<CartographieOptions>,
  élémentsDeLégende: CartographieÉlémentsDeLégende,
  auClicTerritoireCallback: (territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) => void,
}
