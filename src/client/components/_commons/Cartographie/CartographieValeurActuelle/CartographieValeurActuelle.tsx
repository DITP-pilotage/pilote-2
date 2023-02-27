import Cartographie from '@/components/_commons/Cartographie/Cartographie';
import CartographieValeurActuelleProps
  from '@/components/_commons/Cartographie/CartographieValeurActuelle/CartographieValeurActuelle.interface';
import useCartographieValeurActuelle from './useCartographieValeurActuelle';

export default function CartographieValeurActuelle({ données, options }: CartographieValeurActuelleProps) {
  const { donnéesCartographie, légende } = useCartographieValeurActuelle(données);

  return (
    <Cartographie
      données={donnéesCartographie}
      légende={légende}
      options={options}
    />
  );
}
