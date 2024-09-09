import { FunctionComponent } from 'react';
import Cartographie from '@/components/_commons/Cartographie/CartographieNew';
import {
  CartographieDonnéesValeurActuelle,
} from '@/components/_commons/Cartographie/CartographieValeurActuelle/CartographieValeurActuelle.interface';
import CartographieLégendeDégradé from '@/components/_commons/Cartographie/Légende/Dégradé/CartographieLégendeDégradé';
import CartographieLégendeListe from '@/client/components/_commons/Cartographie/Légende/Liste/CartographieLégendeListe';
import { CartographieOptions } from '@/components/_commons/Cartographie/useCartographie.interface';
import {
  CartographieÉlémentsDeLégende,
} from '@/components/_commons/Cartographie/Légende/CartographieLégende.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import useCartographieValeurActuelle from './useCartographieValeurActuelle';

interface CartographieValeurActuelleProps {
  données: CartographieDonnéesValeurActuelle,
  options?: Partial<CartographieOptions>,
  unité?: string | null,
  élémentsDeLégende: CartographieÉlémentsDeLégende,
  auClicTerritoireCallback: (territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) => void
  territoireCode: string
  pathname: '/accueil/chantier/[territoireCode]' | '/chantier/[id]/[territoireCode]'
  mailleSelectionnee: MailleInterne
}

const CartographieValeurActuelle: FunctionComponent<CartographieValeurActuelleProps> = ({
  données,
  options,
  unité,
  auClicTerritoireCallback,
  élémentsDeLégende,
  territoireCode,
  mailleSelectionnee,
  pathname,
}) => {
  const {
    donnéesCartographie,
    légende,
    légendeAdditionnelle,
  } = useCartographieValeurActuelle(données, élémentsDeLégende, mailleSelectionnee, unité);

  return (
    <Cartographie
      auClicTerritoireCallback={auClicTerritoireCallback}
      données={donnéesCartographie}
      mailleSelectionnee={mailleSelectionnee}
      options={options}
      pathname={pathname}
      territoireCode={territoireCode}
    >
      <CartographieLégendeDégradé contenu={légende} />
      <CartographieLégendeListe contenu={légendeAdditionnelle} />
    </Cartographie>
  );
};

export default CartographieValeurActuelle;
