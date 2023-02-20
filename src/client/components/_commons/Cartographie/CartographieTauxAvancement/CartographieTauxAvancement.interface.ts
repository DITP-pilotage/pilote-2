import { CartographieOptions } from '@/components/_commons/Cartographie/useCartographie.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

type CartographieDonnéesTerritoire = { valeurAffichée: string, remplissage: string, libellé: string };
export type CartographieDonnées = Record<CodeInsee, CartographieDonnéesTerritoire>;
export default interface CartographieTauxAvancementProps {
  données: CartographieDonnées,
  options?: Partial<CartographieOptions>,
}
