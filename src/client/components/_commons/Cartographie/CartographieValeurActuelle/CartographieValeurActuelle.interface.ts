import { CartographieOptions } from '@/components/_commons/Cartographie/useCartographie.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export type CartographieDonnéesValeurActuelle = { valeur: number | null, codeInsee: CodeInsee }[];

export default interface CartographieValeurActuelleProps {
  données: CartographieDonnéesValeurActuelle,
  options?: Partial<CartographieOptions>,
  unité?: string | null,
  auClicTerritoireCallback: (territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) => void
}
