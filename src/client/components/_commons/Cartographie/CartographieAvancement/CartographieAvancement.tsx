import { FunctionComponent } from 'react';
import Cartographie from '@/components/_commons/Cartographie/Cartographie';
import CartographieLégendeListe
  from '@/components/_commons/Cartographie/Légende/Liste/CartographieLégendeListe';
import { CartographieOptions } from '@/components/_commons/Cartographie/useCartographie.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { CartographieÉlémentsDeLégende } from '@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface';
import useCartographieAvancement from './useCartographieAvancement';
import { CartographieDonnéesAvancement } from './CartographieAvancement.interface';

interface CartographieAvancementProps {
  données: CartographieDonnéesAvancement,
  options?: Partial<CartographieOptions>,
  élémentsDeLégende: CartographieÉlémentsDeLégende 
  auClicTerritoireCallback: (territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) => void
}

const CartographieAvancement: FunctionComponent<CartographieAvancementProps> = ({ données, options, auClicTerritoireCallback, élémentsDeLégende }) => {
  const { donnéesCartographie, légende } = useCartographieAvancement(données, élémentsDeLégende);

  return (
    <Cartographie
      auClicTerritoireCallback={auClicTerritoireCallback}
      données={donnéesCartographie}
      options={options}
    >
      <CartographieLégendeListe contenu={légende} />
    </Cartographie>
  );
};

export default CartographieAvancement;
