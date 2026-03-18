import { FunctionComponent } from "react";
import { getTraceSvg } from "@/components/_commons/Cartographie/SVG/CartographieSVGContrat";
import { listeTerritoires } from "@/client/constants/territoires";

export const FrontieresRegions: FunctionComponent = () => {
  return (
    <>
      {listeTerritoires.régions.map((region) =>
        getTraceSvg(
          region.code,
          {
            key: `frontiere-${region.code}`,
            className:
              "fill-none stroke-[var(--grey-1000-50)] stroke-[0.4] pointer-events-none",
          },
          "departementale",
        ),
      )}
    </>
  );
};
