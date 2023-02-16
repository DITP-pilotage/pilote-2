import { MailleInterne } from '@/server/domain/chantier/Chantier.interface';
import { CartographieDonnées, CartographieOptions } from '@/components/_commons/Cartographie/useCartographie.interface';

export default interface CartographieMétéoProps {
  données: CartographieDonnées,
  mailleInterne: MailleInterne,
  options?: Partial<CartographieOptions>,
}
