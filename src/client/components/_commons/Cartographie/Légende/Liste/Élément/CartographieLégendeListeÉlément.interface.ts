import { ReactNode } from 'react';
import { Remplissage } from '@/components/_commons/Cartographie/Légende/CartographieLégende.interface';

export default interface CartographieLégendeListeÉlémentProps {
  remplissage: Remplissage,
  children: ReactNode,
}
