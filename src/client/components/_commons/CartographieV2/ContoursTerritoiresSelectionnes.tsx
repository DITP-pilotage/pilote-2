import { FunctionComponent } from "react";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { getTraceSvg } from "@/components/_commons/Cartographie/SVG/CartographieSVGContrat";

type ContoursTerritoiresSelectionnesProps = {
  territoiresCodes: string[];
  maille: MailleInterne;
};

export const ContoursTerritoiresSelectionnes: FunctionComponent<
  ContoursTerritoiresSelectionnesProps
> = ({ territoiresCodes, maille }) => {
  return (
    <>
      {territoiresCodes.map((code) =>
        getTraceSvg(
          code,
          {
            key: `sel-${code}`,
            className:
              "fill-none stroke-[var(--yellow-moutarde-850-200)] stroke-[0.5] pointer-events-none",
          },
          maille,
        ),
      )}
    </>
  );
};
