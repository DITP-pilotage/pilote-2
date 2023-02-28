import Cartographie from '@/components/_commons/Cartographie/Cartographie';
import CartographieLégendeListe
  from '@/components/_commons/Cartographie/Légende/Liste/CartographieLégendeListe';
import CartographieMétéoProps from './CartographieMétéo.interface';
import useCartographieMétéo from './useCartographieMétéo';

export default function CartographieMétéo({ données, options, auClicTerritoireCallback }: CartographieMétéoProps) {
  const { donnéesCartographie, légende } = useCartographieMétéo(données);

  return (
    <Cartographie
      auClicTerritoireCallback={auClicTerritoireCallback}
      données={donnéesCartographie}
      options={options}
    >
      <CartographieLégendeListe contenu={légende} />
    </Cartographie>
  );
}
