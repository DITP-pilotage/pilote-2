import { FunctionComponent } from 'react';
import Cartographie from '@/components/_commons/Cartographie/Cartographie';
import CartographieLégendeDégradé from '@/components/_commons/Cartographie/Légende/Dégradé/CartographieLégendeDégradé';
import CartographieLégendeListe from '@/client/components/_commons/Cartographie/Légende/Liste/CartographieLégendeListe';
import { CartographieOptions } from '@/components/_commons/Cartographie/useCartographie.interface';
import {
  CartographieÉlémentsDeLégende,
} from '@/components/_commons/Cartographie/Légende/CartographieLégende.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import {
  CartographieDonnéesValeurActuelle,
} from '@/components/_commons/Cartographie/CartographieValeurActuelleNew/CartographieValeurActuelle.interface';
import useCartographieValeurActuelle from './useCartographieValeurActuelle';

interface CartographieValeurActuelleProps {
  données: CartographieDonnéesValeurActuelle,
  options?: Partial<CartographieOptions>,
  unité?: string | null,
  élémentsDeLégende: CartographieÉlémentsDeLégende,
  auClicTerritoireCallback: (territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) => void
}

const CartographieValeurActuelle: FunctionComponent<CartographieValeurActuelleProps> = ({
  données,
  options,
  unité,
  auClicTerritoireCallback,
  élémentsDeLégende,
}) => {
  const {
    donnéesCartographie,
    légende,
    légendeAdditionnelle,
  } = useCartographieValeurActuelle(données, élémentsDeLégende, unité);

  return (
    <Cartographie
      auClicTerritoireCallback={auClicTerritoireCallback}
      données={donnéesCartographie}
      options={options}
    >
      <CartographieLégendeDégradé contenu={légende} />
      <CartographieLégendeListe contenu={légendeAdditionnelle} />
    </Cartographie>
  );
};

export default CartographieValeurActuelle;
