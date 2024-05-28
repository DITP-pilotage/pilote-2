import Cartographie from '@/components/_commons/Cartographie/CartographieNew';
import CartographieLégendeListe from '@/components/_commons/Cartographie/Légende/Liste/CartographieLégendeListe';
import CartographieMétéoProps from './CartographieMétéo.interface';
import useCartographieMétéo from './useCartographieMétéo';

export default function CartographieMétéo({
  données,
  options,
  auClicTerritoireCallback,
  élémentsDeLégende,
  territoireCode,
  mailleSelectionnee,
}: CartographieMétéoProps) {
  const { donnéesCartographie, légende } = useCartographieMétéo(données, élémentsDeLégende);

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
