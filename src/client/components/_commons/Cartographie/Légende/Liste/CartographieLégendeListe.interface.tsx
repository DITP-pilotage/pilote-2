import { ReactNode } from 'react';
import { NuancierRemplissage } from '@/client/constants/nuanciers/Nuancier';

export type CartographieÉlémentDeLégendeListe = {
  libellé: string,
  picto?: ReactNode,
  remplissage: NuancierRemplissage,
};

export default interface CartographieLégendeListeProps {
  contenu: CartographieÉlémentDeLégendeListe[],
}
