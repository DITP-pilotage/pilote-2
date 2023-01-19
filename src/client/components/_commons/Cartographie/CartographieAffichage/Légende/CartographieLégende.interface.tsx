import { ReactNode } from 'react';

type CartographieÉlémentDeLégende = {
  couleur: string,
  composant: ReactNode,
};

export default interface CartographieLégendeProps {
  élémentsDeLégende: CartographieÉlémentDeLégende[],
}
