import { ReactNode } from 'react';
import { NuancierRemplissage } from '@/client/constants/nuanciers/Nuancier';

export default interface CartographieLégendeListeÉlémentProps {
  remplissage: NuancierRemplissage,
  children: ReactNode,
}
