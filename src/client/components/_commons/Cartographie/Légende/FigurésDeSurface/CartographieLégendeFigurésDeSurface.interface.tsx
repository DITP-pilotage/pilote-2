import { ReactNode } from 'react';
import { NuancierRemplissage } from '@/client/constants/nuanciers/nuancier';

export type CartographieÉlémentDeLégendeFigurésDeSurface = {
  libellé: string,
  picto?: ReactNode,
  remplissage: NuancierRemplissage,
};

export default interface CartographieLégendeFigurésDeSurfaceProps {
  contenu: CartographieÉlémentDeLégendeFigurésDeSurface[],
}
