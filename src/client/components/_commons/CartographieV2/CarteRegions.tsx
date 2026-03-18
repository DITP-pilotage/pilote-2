import { FunctionComponent } from "react";
import { getTraceSvg } from "@/components/_commons/Cartographie/SVG/CartographieSVGContrat";
import { listeTerritoires } from "@/client/constants/territoires";
import { GetTerritoireProps } from "./types";

type CarteRegionsProps = {
  getTerritoireProps: GetTerritoireProps;
};

export const CarteRegions: FunctionComponent<CarteRegionsProps> = ({
  getTerritoireProps,
}) => {
  return (
    <>
      {listeTerritoires.régions.map((territoire) =>
        getTraceSvg(
          territoire.code,
          getTerritoireProps(territoire),
          "regionale",
        ),
      )}
    </>
  );
};
