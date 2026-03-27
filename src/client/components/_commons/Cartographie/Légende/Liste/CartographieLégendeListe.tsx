import { FunctionComponent } from "react";
import { CartographieÉlémentDeLégende } from "@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface";
import CartographieLégendeListeÉlément from "./Élément/CartographieLégendeListeÉlément";

interface CartographieLégendeListeProps {
  contenu: CartographieÉlémentDeLégende[];
}

const CartographieLégendeListe: FunctionComponent<
  CartographieLégendeListeProps
> = ({ contenu }) => {
  return (
    <ul className="flex flex-wrap max-w-[25rem] mx-auto list-none fr-mt-1w fr-mb-0 fr-pl-0">
      {contenu.map(({ remplissage, libellé, picto }) => (
        <CartographieLégendeListeÉlément
          key={`carto-légende-${libellé}`}
          remplissage={remplissage}
        >
          <span>{libellé}</span>
          {picto ?? null}
        </CartographieLégendeListeÉlément>
      ))}
    </ul>
  );
};

export default CartographieLégendeListe;
