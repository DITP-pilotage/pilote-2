import { FunctionComponent } from "react";
import { Remplissage } from "@/components/_commons/Cartographie/Légende/CartographieLégende.interface";
import { LegendeCartographieSwatch } from "@/components/_commons/CartographieV2/LegendeCartographieSwatch";

type LegendeCartographieItem = {
  remplissage: Remplissage;
  libellé: string;
};

type LegendeCartographieProps = {
  items: LegendeCartographieItem[];
};

export const LegendeCartographie: FunctionComponent<
  LegendeCartographieProps
> = ({ items }) => {
  return (
    <ul className="pl-0 flex gap-1 flex-wrap list-none mb-4">
      {items.map((item) => (
        <li
          className="pr-3 text-dsfr-mention-grey flex items-center gap-1"
          key={item.libellé}
        >
          <LegendeCartographieSwatch remplissage={item.remplissage} />
          <span className="text-xs">{item.libellé}</span>
        </li>
      ))}
    </ul>
  );
};
