import Cartographie from '@/components/_commons/Cartographie/CartographieNew';
import CartographieLégendeListe from '@/components/_commons/Cartographie/Légende/Liste/CartographieLégendeListe';
import CartographieAvancementProps from './CartographieAvancement.interface';
import useCartographieAvancement from './useCartographieAvancement';

export default function CartographieAvancement({ données, options, auClicTerritoireCallback, élémentsDeLégende, territoireCode, mailleSelectionnee }: CartographieAvancementProps) {
  const { donnéesCartographie, légende } = useCartographieAvancement(données, élémentsDeLégende);

  return (
    <Cartographie
      auClicTerritoireCallback={auClicTerritoireCallback}
      données={donnéesCartographie}
      mailleSelectionnee={mailleSelectionnee}
      options={options}
      territoireCode={territoireCode}
    >
      <CartographieLégendeListe contenu={légende} />
    </Cartographie>
  );
}
