import { FunctionComponent } from "react";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";
import { useTerritoiresCompares } from "@/client/hooks/useTerritoiresCompares";
import { getTraceSvg } from "./CartographieSVGContrat";

export const CartographieTerritoireSélectionné: FunctionComponent<{
  territoireCode: string;
  mailleSelectionnee: MailleInterne;
}> = ({ territoireCode, mailleSelectionnee }) => {
  const { récupérerDétailsSurUnTerritoire } = useTerritoireHabilitation();

  const [territoiresCompares] = useTerritoiresCompares();

  const detailTerritoiresComparés = [
    territoireCode,
    ...territoiresCompares.split(",").filter(Boolean),
  ].map(récupérerDétailsSurUnTerritoire);

  if (territoireCode === "NAT-FR") return null;

  return (
    <g>
      {territoiresCompares.length > 0
        ? detailTerritoiresComparés.map((territoire) =>
            getTraceSvg(
              territoire.code,
              {
                className:
                  "fill-none stroke-dsfr-moutarde-main-850 [stroke-width:0.5]",
                key: territoire.code,
              },
              mailleSelectionnee,
            ),
          )
        : getTraceSvg(
            territoireCode,
            {
              className:
                "fill-none stroke-dsfr-moutarde-main-850 [stroke-width:0.5]",
              key: territoireCode,
            },
            mailleSelectionnee,
          )}
    </g>
  );
};
