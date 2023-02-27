import Cartographie from '@/components/_commons/Cartographie/Cartographie';
import CartographieLégendeFigurésDeSurface
  from '@/components/_commons/Cartographie/Légende/FigurésDeSurface/CartographieLégendeFigurésDeSurface';
import CartographieMétéoProps from './CartographieMétéo.interface';
import useCartographieMétéo from './useCartographieMétéo';

export default function CartographieMétéo({ données, options }: CartographieMétéoProps) {
  const { donnéesCartographie, légende } = useCartographieMétéo(données);

  return (
    <Cartographie
      données={donnéesCartographie}
      options={options}
    >
      <CartographieLégendeFigurésDeSurface contenu={légende} />
    </Cartographie>
  );
}
