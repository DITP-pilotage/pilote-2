import { FunctionComponent } from "react";
import hachuresGrisBlanc from "@/client/constants/légendes/hachure/hachuresGrisBlanc";
import { estHachure } from "@/client/constants/légendes/hachure/hachure";
import { Remplissage } from "@/components/_commons/Cartographie/Légende/CartographieLégende.interface";

type LegendeCartographieItem = {
  remplissage: Remplissage;
  libellé: string;
};

type LegendeCartographieProps = {
  items: LegendeCartographieItem[];
};

const MISE_A_LECHELLE = 2.75;

export const LegendeCartographie: FunctionComponent<
  LegendeCartographieProps
> = ({ items }) => {
  return (
    <ul className="fr-mb-0 fr-pl-0 flex gap-1 flex-wrap list-none">
      {items.map((item) => (
        <li
          className="fr-pr-3v !text-dsfr-mention-grey flex items-center gap-1"
          key={item.libellé}
        >
          <svg
            className="min-w-[12px] min-h-[12px] w-3 h-3"
            version="1.2"
            viewBox={`0 0 ${MISE_A_LECHELLE} ${MISE_A_LECHELLE}`}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {estHachure(item.remplissage) && hachuresGrisBlanc.patternSVG}
            </defs>
            <rect
              fill={item.remplissage}
              height={MISE_A_LECHELLE}
              width={MISE_A_LECHELLE}
              x={0}
              y={0}
            />
          </svg>
          <span className="text-xs">{item.libellé}</span>
        </li>
      ))}
    </ul>
  );
};
