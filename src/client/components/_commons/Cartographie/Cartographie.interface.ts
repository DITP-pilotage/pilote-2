import { CartographieOptions } from '@/components/_commons/Cartographie/useCartographie.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { CartographieÉlémentDeLégende } from './Légende/CartographieLégende.interface';

export type CartographieDonnées = {
  [key in CodeInsee]: {
    valeurAffichée: string, 
    remplissage: string, 
    libellé: string
  }
};

export default interface CartographieProps {
  légende: CartographieÉlémentDeLégende[],
  options?: Partial<CartographieOptions>,
  données: CartographieDonnées,
}
