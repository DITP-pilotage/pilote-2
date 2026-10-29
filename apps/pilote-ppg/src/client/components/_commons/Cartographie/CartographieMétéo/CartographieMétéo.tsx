import { FunctionComponent } from "react";
import { ReadOnlyCartographie } from "@/components/_commons/CartographieV2/ReadOnlyCartographie";
import { CartographieÉlémentsDeLégende } from "@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface";
import { MailleInterne } from "@/shared/maille/Maille.interface";
import { useCartographieMétéo } from "./useCartographieMétéo";
import { CartographieDonnéesMétéo } from "./CartographieMétéo.interface";

interface CartographieMétéoProps {
  données: CartographieDonnéesMétéo;
  élémentsDeLégende: CartographieÉlémentsDeLégende;
  territoireCode?: string;
  mailleSelectionnee: MailleInterne;
}

const CartographieMétéo: FunctionComponent<CartographieMétéoProps> = ({
  données,
  élémentsDeLégende,
  territoireCode,
  mailleSelectionnee,
}) => {
  const { donnéesCartographie, légende } = useCartographieMétéo(
    données,
    élémentsDeLégende,
  );

  return (
    <ReadOnlyCartographie
      donnees={donnéesCartographie}
      legende={légende}
      maille={mailleSelectionnee}
      territoireCode={territoireCode}
    />
  );
};

export default CartographieMétéo;
