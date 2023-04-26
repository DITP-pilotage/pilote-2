import Cartographie from '@/components/_commons/Cartographie/Cartographie';
import CartographieLégendeListe
  from '@/components/_commons/Cartographie/Légende/Liste/CartographieLégendeListe';
import CartographieAvancementProps from './CartographieAvancement.interface';
import useCartographieAvancement from './useCartographieAvancement';

export default function CartographieAvancement({ données, options, auClicTerritoireCallback, estInteractif }: CartographieAvancementProps) {
  const { donnéesCartographie, légende } = useCartographieAvancement(données);

  return (
    <Cartographie
      auClicTerritoireCallback={auClicTerritoireCallback}
      données={donnéesCartographie}
      estInteractif={estInteractif}
      options={options}
    >
      <CartographieLégendeListe contenu={légende} />
    </Cartographie>
  );
}
