import { CartographieOptions } from '@/components/_commons/Cartographie/useCartographie.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { CartographieÉlémentDeLégende } from './Légende/CartographieLégende.interface';

type CartographieDonnéesTerritoire = { valeurAffichée: string, remplissage: string, libellé: string };
export type CartographieDonnées = Record<CodeInsee, CartographieDonnéesTerritoire>;

export default interface CartographieProps {
  légende: CartographieÉlémentDeLégende[],
  options?: Partial<CartographieOptions>,
  données: CartographieDonnées,
}
