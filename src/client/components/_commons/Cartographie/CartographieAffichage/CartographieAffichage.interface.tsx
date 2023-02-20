import { ReactNode } from 'react';
import { CartographieOptions } from '@/components/_commons/Cartographie/useCartographie.interface';
import { CartographieDonnées } from '../CartographieTauxAvancement/CartographieTauxAvancement.interface';

export default interface CartographieAffichageProps {
  children?: ReactNode,
  options?: Partial<CartographieOptions>,
  données: CartographieDonnées,
}
