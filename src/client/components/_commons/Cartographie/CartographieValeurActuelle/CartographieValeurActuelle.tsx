import Cartographie from '@/components/_commons/Cartographie/Cartographie';
import CartographieValeurActuelleProps
  from '@/components/_commons/Cartographie/CartographieValeurActuelle/CartographieValeurActuelle.interface';
import CartographieLégendeDégradéDeSurface
  from '@/components/_commons/Cartographie/Légende/DégradéDeSurface/CartographieLégendeDégradéDeSurface';
import useCartographieValeurActuelle from './useCartographieValeurActuelle';

export default function CartographieValeurActuelle({ données, options }: CartographieValeurActuelleProps) {
  const { donnéesCartographie, légende } = useCartographieValeurActuelle(données);

  return (
    <Cartographie
      données={donnéesCartographie}
      options={options}
    >
      <CartographieLégendeDégradéDeSurface contenu={légende} />
    </Cartographie>
  );
}
