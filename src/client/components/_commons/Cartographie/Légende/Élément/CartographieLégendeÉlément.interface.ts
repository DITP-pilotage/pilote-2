import { ReactNode } from 'react';
import { NuancierRemplissage } from '@/client/constants/nuanciers/nuancier';

export default interface CartographieLégendeÉlémentProps {
  remplissage: NuancierRemplissage,
  children: ReactNode,
}
