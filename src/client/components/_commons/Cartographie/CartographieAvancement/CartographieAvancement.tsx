import Cartographie from '@/components/_commons/Cartographie/Cartographie';
import CartographieAvancementProps from './CartographieAvancement.interface';
import useCartographieAvancement from './useCartographieAvancement';
import CartographieLégendeListe
  from '@/components/_commons/Cartographie/Légende/Liste/CartographieLégendeListe';

export default function CartographieAvancement({ données, options }: CartographieAvancementProps) {
  const { donnéesCartographie, légende } = useCartographieAvancement(données);

  return (
    <Cartographie
      données={donnéesCartographie}
      options={options}
    >
      <CartographieLégendeListe contenu={légende} />
    </Cartographie>
  );
}
