import { CartographieOptions } from '@/components/_commons/Cartographie/useCartographie.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { CartographieÉlémentsDeLégende } from '@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface';


export type CartographieDonnéesValeurActuelle = { valeur: number | null, codeInsee: CodeInsee, estApplicable: boolean | null,   }[];

export default interface CartographieValeurActuelleProps {
  données: CartographieDonnéesValeurActuelle,
  options?: Partial<CartographieOptions>,
  unité?: string | null,
  élémentsDeLégende: CartographieÉlémentsDeLégende,
  auClicTerritoireCallback: (territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) => void
}
