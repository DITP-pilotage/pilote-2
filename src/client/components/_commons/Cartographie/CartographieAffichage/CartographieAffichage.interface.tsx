import { ReactNode } from 'react';
import { MailleInterne } from '@/server/domain/chantier/Chantier.interface';
import { CartographieDonnées, CartographieOptions } from '../useCartographie';
export default interface CartographieAffichageProps {
  children?: ReactNode,
  options?: Partial<CartographieOptions>,
  données: CartographieDonnées,
  niveauDeMaille: MailleInterne,
}
