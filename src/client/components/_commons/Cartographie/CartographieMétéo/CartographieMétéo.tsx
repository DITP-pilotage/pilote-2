import { FunctionComponent } from 'react';
import Cartographie from '@/components/_commons/Cartographie/Cartographie';
import CartographieLégendeListe
  from '@/components/_commons/Cartographie/Légende/Liste/CartographieLégendeListe';
import { CartographieOptions } from '@/components/_commons/Cartographie/useCartographie.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { CartographieÉlémentsDeLégende } from '@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface';
import useCartographieMétéo from './useCartographieMétéo';
import { CartographieDonnéesMétéo } from './CartographieMétéo.interface';

interface CartographieMétéoProps {
  données: CartographieDonnéesMétéo,
  options?: Partial<CartographieOptions>,
  élémentsDeLégende: CartographieÉlémentsDeLégende,
  auClicTerritoireCallback: (territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) => void,
}

const CartographieMétéo: FunctionComponent<CartographieMétéoProps> = ({ données, options, auClicTerritoireCallback, élémentsDeLégende }) => {
  const { donnéesCartographie, légende } = useCartographieMétéo(données, élémentsDeLégende);

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

export default CartographieMétéo;
