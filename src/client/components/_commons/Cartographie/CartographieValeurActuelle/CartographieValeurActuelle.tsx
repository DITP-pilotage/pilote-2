import Cartographie from '@/components/_commons/Cartographie/Cartographie';
import CartographieValeurActuelleProps
  from '@/components/_commons/Cartographie/CartographieValeurActuelle/CartographieValeurActuelle.interface';
import CartographieLégendeDégradé
  from '@/components/_commons/Cartographie/Légende/Dégradé/CartographieLégendeDégradé';
import useCartographieValeurActuelle from './useCartographieValeurActuelle';

export default function CartographieValeurActuelle({ données, options }: CartographieValeurActuelleProps) {
  const { donnéesCartographie, légende } = useCartographieValeurActuelle(données);

  return (
    <Cartographie
      données={donnéesCartographie}
      options={options}
    >
      <CartographieLégendeDégradé contenu={légende} />
    </Cartographie>
  );
}
