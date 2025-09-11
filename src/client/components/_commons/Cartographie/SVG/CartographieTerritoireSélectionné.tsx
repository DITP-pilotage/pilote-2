import { parseAsString, useQueryState } from "nuqs";
import { FunctionComponent } from "react";
import { actionsTerritoiresStore } from "@/client/stores/useTerritoiresStore/useTerritoiresStore";
import { getTraceSvg } from "./CartographieSVGContrat";

export const CartographieTerritoireSélectionné: FunctionComponent<{
  territoireCode: string;
}> = ({ territoireCode }) => {
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const [territoiresCompares] = useQueryState(
    "territoiresCompares",
    parseAsString.withDefault(""),
  );

  const detailTerritoiresComparés = [
    territoireCode,
    ...territoiresCompares.split(",").filter(Boolean),
  ].map(récupérerDétailsSurUnTerritoire);

  return (
    <g>
      {territoiresCompares.length > 0
        ? detailTerritoiresComparés.map((territoire) =>
            getTraceSvg(territoire.code, {
              className: "territoire-sélectionné",
              key: territoire.code,
            }),
          )
        : getTraceSvg(territoireCode, {
            className: "territoire-sélectionné",
            key: territoireCode,
          })}
    </g>
  );
};
