import { MailleInterne } from '@/server/domain/chantier/Chantier.interface';
import { CartographieDonnées, CartographieOptions } from '../Cartographie.interface';

export default interface CartographieTauxAvancementProps {
  données: CartographieDonnées,
  mailleInterne: MailleInterne,
  options?: Partial<CartographieOptions>,
}
