import Cartographie from '@/components/_commons/Cartographie/Cartographie';
import CartographieAvancementProps from './CartographieAvancement.interface';
import useCartographieAvancement from './useCartographieAvancement';

export default function CartographieAvancement({ données, options }: CartographieAvancementProps) {
  const { donnéesCartographie, légende } = useCartographieAvancement(données);

  return (
    <Cartographie
      données={donnéesCartographie}
      légende={légende}
      options={options}
    />
  );
}
