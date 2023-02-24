import { ReactNode } from 'react';
import { NuancierRemplissage } from '@/client/constants/nuanciers/nuancier';

export type CartographieÉlémentDeLégende = {
  libellé: string,
  picto?: ReactNode,
  remplissage: NuancierRemplissage,
};

export default interface CartographieLégendeProps {
  légende: CartographieÉlémentDeLégende[],
}
