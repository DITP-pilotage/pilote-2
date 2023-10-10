import Cartographie from '@/components/_commons/Cartographie/Cartographie';
import CartographieValeurActuelleProps from '@/components/_commons/Cartographie/CartographieValeurActuelle/CartographieValeurActuelle.interface';
import CartographieLégendeDégradé from '@/components/_commons/Cartographie/Légende/Dégradé/CartographieLégendeDégradé';
import CartographieLégendeListe from '@/client/components/_commons/Cartographie/Légende/Liste/CartographieLégendeListe';
import useCartographieValeurActuelle from './useCartographieValeurActuelle';

export default function CartographieValeurActuelle({ données, options, unité, auClicTerritoireCallback, élémentsDeLégende }: CartographieValeurActuelleProps) {
  const { donnéesCartographie, légende, légendeAdditionnelle } = useCartographieValeurActuelle(données, élémentsDeLégende, unité);

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
}
