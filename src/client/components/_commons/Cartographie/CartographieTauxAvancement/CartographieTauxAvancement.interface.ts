import { NiveauDeMaille } from '@/client/stores/useNiveauDeMailleStore/useNiveauDeMailleStore.interface';
import { CartographieDonnées } from '../Cartographie.interface';

export default interface CartographieTauxAvancementProps {
  données: CartographieDonnées,
  territoireSélectionnable?: boolean
  niveauDeMaille: NiveauDeMaille
}
