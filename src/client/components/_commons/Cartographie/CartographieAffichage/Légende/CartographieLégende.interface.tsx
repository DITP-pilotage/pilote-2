import { ReactNode } from 'react';

type CartographieÉlémentDeLégende = {
  couleur: string,
  libellé: string,
  picto?: ReactNode,
  hachures?: boolean,
};

export default interface CartographieLégendeProps {
  élémentsDeLégende: CartographieÉlémentDeLégende[],
}
