import { parseAsString, useQueryState } from "nuqs";
import { FunctionComponent } from "react";
import { actionsTerritoiresStore } from "@/client/stores/useTerritoiresStore/useTerritoiresStore";
import {
  CARTOGRAPHIE_SVG_AS_JSON,
  getTraceSvg,
} from "./CartographieSVGContrat";

export const CartographieTerritoireSélectionné: FunctionComponent<{
  territoireCode: string;
}> = ({ territoireCode }) => {
  const sourceSvgAsJson = CARTOGRAPHIE_SVG_AS_JSON;

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
      {territoiresCompares.length > 0 ? (
        detailTerritoiresComparés.map((territoire) =>
          sourceSvgAsJson ? (
            <path
              className="territoire-sélectionné"
              d={getTraceSvg(sourceSvgAsJson, territoire.code)}
              key={territoire.code}
            />
          ) : null,
        )
      ) : sourceSvgAsJson ? (
        <path
          className="territoire-sélectionné"
          d={getTraceSvg(sourceSvgAsJson, territoireCode)}
          key={territoireCode}
        />
      ) : null}
    </g>
  );
};
