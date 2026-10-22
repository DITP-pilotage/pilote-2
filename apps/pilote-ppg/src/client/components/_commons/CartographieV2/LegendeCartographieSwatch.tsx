import { FunctionComponent } from "react";
import { HachuresDiagonales } from "@/client/constants/légendes/hachure/hachures";
import { estHachure } from "@/client/constants/légendes/hachure/hachure";
import { Remplissage } from "@/components/_commons/Cartographie/Légende/CartographieLégende.interface";

const MISE_A_LECHELLE = 2.75;

export const LegendeCartographieSwatch: FunctionComponent<{
  remplissage: Remplissage;
}> = ({ remplissage }) => (
  <svg
    className="min-w-[12px] min-h-[12px] w-3 h-3"
    version="1.2"
    viewBox={`0 0 ${MISE_A_LECHELLE} ${MISE_A_LECHELLE}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    {estHachure(remplissage) ? (
      <HachuresDiagonales taille={MISE_A_LECHELLE} />
    ) : (
      <rect
        fill={remplissage}
        height={MISE_A_LECHELLE}
        width={MISE_A_LECHELLE}
        x={0}
        y={0}
      />
    )}
  </svg>
);
