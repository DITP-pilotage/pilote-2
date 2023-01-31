import { NiveauDeMaille } from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore.interface';
import { CartographieDonnées, CartographieOptions } from '../Cartographie.interface';

export default interface CartographieMétéoProps {
  données: CartographieDonnées,
  niveauDeMaille: NiveauDeMaille,
  options?: Partial<CartographieOptions>,
}
