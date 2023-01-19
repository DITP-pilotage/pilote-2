import { NiveauDeMaille } from '@/client/stores/useNiveauDeMailleStore/useNiveauDeMailleStore.interface';
import { CartographieDonnées, CartographieOptions } from '../Cartographie.interface';

export default interface CartographieTauxAvancementProps {
  données: CartographieDonnées,
  niveauDeMaille: NiveauDeMaille,
  options?: Partial<CartographieOptions>,
}
