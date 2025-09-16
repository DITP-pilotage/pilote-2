import { parseAsString, useQueryState } from "nuqs";
import { FunctionComponent } from "react";
import { actionsTerritoiresStore } from "@/client/stores/useTerritoiresStore/useTerritoiresStore";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { getTraceSvg } from "./CartographieSVGContrat";

export const CartographieTerritoireSélectionné: FunctionComponent<{
  territoireCode: string;
  mailleSelectionnee: MailleInterne;
}> = ({ territoireCode, mailleSelectionnee }) => {
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const [territoiresCompares] = useQueryState(
    "territoiresCompares",
    parseAsString.withDefault(""),
  );

  const detailTerritoiresComparés = [
    territoireCode,
    ...territoiresCompares.split(",").filter(Boolean),
  ].map(récupérerDétailsSurUnTerritoire);

  const mode = territoireCode.startsWith("DEPT-") ? "departements" : "regions";
  return (
    <g>
      {territoiresCompares.length > 0
        ? detailTerritoiresComparés.map((territoire) =>
            getTraceSvg(
              territoire.code,
              {
                className: "territoire-sélectionné",
                key: territoire.code,
              },
              mailleSelectionnee,
            ),
          )
        : getTraceSvg(
            territoireCode,
            {
              className: "territoire-sélectionné",
              key: territoireCode,
            },
            mailleSelectionnee,
          )}
    </g>
  );
};
