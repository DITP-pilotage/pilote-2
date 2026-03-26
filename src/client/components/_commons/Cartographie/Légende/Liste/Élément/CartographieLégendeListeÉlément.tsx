import { FunctionComponent, ReactNode } from "react";
import hachuresGrisBlanc from "@/client/constants/légendes/hachure/hachuresGrisBlanc";
import { estHachure } from "@/client/constants/légendes/hachure/hachure";
import { Remplissage } from "@/components/_commons/Cartographie/Légende/CartographieLégende.interface";

interface CartographieLégendeListeÉlémentProps {
  remplissage: Remplissage;
  children: ReactNode;
}

const miseÀLÉchelle = 2.75; // sert pour faire correspondre la taille des hachures sur la carte et dans la légende

const CartographieLégendeListeÉlément: FunctionComponent<
  CartographieLégendeListeÉlémentProps
> = ({ children, remplissage }) => {
  return (
    <li className="flex items-start text-xs leading-4 fr-pr-3v fr-pb-1v !text-dsfr-mention-grey">
      <svg
        className="fr-mr-1v fr-mt-1v w-[0.6rem] h-[0.6rem] border border-dsfr-grey-50"
        version="1.2"
        viewBox={`0 0 ${miseÀLÉchelle} ${miseÀLÉchelle}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>{estHachure(remplissage) && hachuresGrisBlanc.patternSVG}</defs>
        <rect
          fill={remplissage}
          height={miseÀLÉchelle}
          width={miseÀLÉchelle}
          x={0}
          y={0}
        />
      </svg>
      {children}
    </li>
  );
};

export default CartographieLégendeListeÉlément;
