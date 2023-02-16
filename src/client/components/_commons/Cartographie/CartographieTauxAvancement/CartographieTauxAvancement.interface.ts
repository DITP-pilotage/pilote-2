import { MailleInterne } from '@/server/domain/chantier/Chantier.interface';
import { CartographieDonnées, CartographieOptions } from '@/components/_commons/Cartographie/useCartographie.interface';

export default interface CartographieTauxAvancementProps {
  données: CartographieDonnées,
  niveauDeMaille: MailleInterne,
  options?: Partial<CartographieOptions>,
}
