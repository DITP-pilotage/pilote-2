import { MailleInterne } from '@/server/domain/chantier/Chantier.interface';
import { CartographieDonnées, CartographieOptions } from '../useCartographie';

export default interface CartographieMétéoProps {
  données: CartographieDonnées,
  mailleInterne: MailleInterne,
  options?: Partial<CartographieOptions>,
}
