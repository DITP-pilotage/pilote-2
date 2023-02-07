import { ReactNode } from 'react';
import { NuancierRemplissage } from '@/client/constants/nuanciers/nuancier';

type CartographieÉlémentDeLégende = {
  libellé: string,
  picto?: ReactNode,
  remplissage: NuancierRemplissage,
};

export default interface CartographieLégendeProps {
  élémentsDeLégende: CartographieÉlémentDeLégende[],
}
