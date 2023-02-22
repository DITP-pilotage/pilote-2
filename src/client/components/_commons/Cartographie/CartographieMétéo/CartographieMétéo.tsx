import Cartographie from '@/components/_commons/Cartographie/Cartographie';
import CartographieMétéoProps from './CartographieMétéo.interface';
import useCartographieMétéo from './useCartographieMétéo';

export default function CartographieMétéo({ données, options }: CartographieMétéoProps) {
  const { donnéesCartographie, légende } = useCartographieMétéo(données);

  return (
    <Cartographie
      données={donnéesCartographie}
      légende={légende}
      options={options}
    />
  );
}
