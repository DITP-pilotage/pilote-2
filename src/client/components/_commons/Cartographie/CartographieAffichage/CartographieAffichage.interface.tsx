import { ReactNode } from 'react';
import { MailleInterne } from '@/server/domain/chantier/Chantier.interface';
import { CartographieDonnées, CartographieOptions } from '@/components/_commons/Cartographie/useCartographie.interface';

export default interface CartographieAffichageProps {
  children?: ReactNode,
  options?: Partial<CartographieOptions>,
  données: CartographieDonnées,
  niveauDeMaille: MailleInterne,
}
