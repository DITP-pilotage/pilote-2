import Cartographie from '@/components/_commons/Cartographie/Cartographie';
import CartographieLégendeFigurésDeSurface
  from '@/components/_commons/Cartographie/Légende/FigurésDeSurface/CartographieLégendeFigurésDeSurface';
import CartographieAvancementProps from './CartographieAvancement.interface';
import useCartographieAvancement from './useCartographieAvancement';

export default function CartographieAvancement({ données, options }: CartographieAvancementProps) {
  const { donnéesCartographie, légende } = useCartographieAvancement(données);

  return (
    <Cartographie
      données={donnéesCartographie}
      options={options}
    >
      <CartographieLégendeFigurésDeSurface contenu={légende} />
    </Cartographie>
  );
}
