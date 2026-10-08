import { FunctionComponent } from "react";
import { ReadOnlyCartographie } from "@/components/_commons/CartographieV2/ReadOnlyCartographie";
import { CartographieÉlémentsDeLégende } from "@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface";
import { MailleInterne } from "@/shared/maille/Maille.interface";
import useCartographieAvancement from "./useCartographieAvancement";
import { CartographieDonnéesAvancement } from "./CartographieAvancement.interface";

interface CartographieAvancementProps {
  données: CartographieDonnéesAvancement;
  élémentsDeLégende: CartographieÉlémentsDeLégende;
  territoireCode?: string;
  mailleSelectionnee: MailleInterne;
  jalon: number;
}

const CartographieAvancement: FunctionComponent<
  CartographieAvancementProps
> = ({
  données,
  élémentsDeLégende,
  territoireCode,
  mailleSelectionnee,
  jalon,
}) => {
  const { donnéesCartographie, légende } = useCartographieAvancement(
    données,
    élémentsDeLégende,
    jalon,
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

export default CartographieAvancement;
