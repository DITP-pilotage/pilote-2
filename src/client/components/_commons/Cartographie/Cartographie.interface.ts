import { CartographieOptions } from '@/components/_commons/Cartographie/useCartographie.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import {
  CartographieÉlémentDeLégendeFigurésDeSurface,
} from '@/components/_commons/Cartographie/Légende/FigurésDeSurface/CartographieLégendeFigurésDeSurface.interface';
import {
  CartographieLégendeDégradéDeSurfaceContenu,
} from '@/components/_commons/Cartographie/Légende/DégradéDeSurface/CartographieLégendeDégradéDeSurfaceProps.interface';

export type CartographieDonnées = {
  [key in CodeInsee]: {
    valeurAffichée: string, 
    remplissage: string, 
    libellé: string
  }
};

export type CartographieLégende = {
  type: 'FIGURÉS_DE_SURFACE',
  contenu: CartographieÉlémentDeLégendeFigurésDeSurface[],
} | {
  type: 'DÉGRADÉ_DE_SURFACE',
  contenu: CartographieLégendeDégradéDeSurfaceContenu,
};

export default interface CartographieProps {
  légende: CartographieLégende,
  options?: Partial<CartographieOptions>,
  données: CartographieDonnées,
}
