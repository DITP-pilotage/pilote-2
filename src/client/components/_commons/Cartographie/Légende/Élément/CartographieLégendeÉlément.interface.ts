import { ReactNode } from 'react';
import { NuancierRemplissage } from '@/client/constants/nuanciers/Nuancier';

export default interface CartographieLégendeFiguréDeSurfaceÉlémentProps {
  remplissage: NuancierRemplissage,
  children: ReactNode,
}
