import { ReactNode } from 'react';
import { NuancierRemplissage } from '@/client/constants/nuanciers/nuancier';

export default interface CartographieLégendeListeÉlémentProps {
  remplissage: NuancierRemplissage,
  children: ReactNode,
}
