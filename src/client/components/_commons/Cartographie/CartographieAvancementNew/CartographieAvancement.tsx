import { FunctionComponent } from 'react';
import Cartographie from '@/components/_commons/Cartographie/CartographieNew';
import CartographieLégendeListe from '@/components/_commons/Cartographie/Légende/Liste/CartographieLégendeListe';
import { CartographieOptions } from '@/components/_commons/Cartographie/useCartographie.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import {
  CartographieÉlémentsDeLégende,
} from '@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import useCartographieAvancement from './useCartographieAvancement';
import { CartographieDonnéesAvancement } from './CartographieAvancement.interface';

interface CartographieAvancementProps {
  données: CartographieDonnéesAvancement,
  options?: Partial<CartographieOptions>,
  élémentsDeLégende: CartographieÉlémentsDeLégende
  auClicTerritoireCallback: (territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) => void
  territoireCode: string,
  pathname: '/accueil/ppg/[territoireCode]' | '/ppg/[id]/[territoireCode]' | null,
  mailleSelectionnee: MailleInterne,
}

const CartographieAvancement: FunctionComponent<CartographieAvancementProps> = ({
  données,
  options,
  pathname,
  auClicTerritoireCallback,
  élémentsDeLégende,
  territoireCode,
  mailleSelectionnee,
}) => {
  const { donnéesCartographie, légende } = useCartographieAvancement(données, élémentsDeLégende, mailleSelectionnee);

  return (
    <Cartographie
      auClicTerritoireCallback={auClicTerritoireCallback}
      données={donnéesCartographie}
      mailleSelectionnee={mailleSelectionnee}
      options={options}
      pathname={pathname}
      territoireCode={territoireCode}
    >
      <CartographieLégendeListe contenu={légende} />
    </Cartographie>
  );
};

export default CartographieAvancement;
