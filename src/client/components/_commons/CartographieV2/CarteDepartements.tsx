import { FunctionComponent } from "react";
import { getTraceSvg } from "@/components/_commons/Cartographie/SVG/CartographieSVGContrat";
import { listeTerritoires } from "@/client/constants/territoires";
import { GetTerritoireProps } from "./CartographieV2.types";

type CarteDepartementsProps = {
  getTerritoireProps: GetTerritoireProps;
};

export const CarteDepartements: FunctionComponent<CarteDepartementsProps> = ({
  getTerritoireProps,
}) => {
  return (
    <>
      {listeTerritoires.départements.map((territoire) =>
        getTraceSvg(
          territoire.code,
          getTerritoireProps(territoire),
          "departementale",
        ),
      )}
    </>
  );
};
