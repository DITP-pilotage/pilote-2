import { ReactNode } from 'react';
import { Remplissage } from '@/components/_commons/Cartographie/Légende/CartographieLégende.interface';

export type CartographieÉlémentDeLégendeListe = {
  libellé: string,
  picto?: ReactNode,
  remplissage: Remplissage,
};

export default interface CartographieLégendeListeProps {
  contenu: CartographieÉlémentDeLégendeListe[],
}
