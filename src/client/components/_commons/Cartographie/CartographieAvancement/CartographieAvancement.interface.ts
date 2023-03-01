import { CartographieOptions } from '@/components/_commons/Cartographie/useCartographie.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export type CartographieDonnéesAvancement = { valeur: number | null, codeInsee: CodeInsee }[];

export default interface CartographieAvancementProps {
  données: CartographieDonnéesAvancement,
  options?: Partial<CartographieOptions>,
  auClicTerritoireCallback: (territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) => void
}
