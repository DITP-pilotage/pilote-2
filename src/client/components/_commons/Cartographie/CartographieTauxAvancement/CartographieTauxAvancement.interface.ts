import { CartographieDonnées, NiveauDeMaille } from '../Cartographie.interface';

export default interface CartographieTauxAvancementProps {
  données: CartographieDonnées,
  territoireSélectionnable?: boolean
  niveauDeMaille: NiveauDeMaille
}
