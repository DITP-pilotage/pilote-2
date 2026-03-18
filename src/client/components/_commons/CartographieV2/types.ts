import { ReactNode } from "react";

export type CartographieV2Donnee = {
  remplissage: string;
  libelle: string;
  contenuInfoBulle?: ReactNode;
};

export type GetTerritoireProps = (territoire: {
  code: string;
  nom: string;
}) => {
  key: string;
  className: string;
  fill: string;
  onClick?: () => void;
  onMouseEnter?: (
    event: React.MouseEvent<SVGPolygonElement | SVGPathElement>,
  ) => void;
  onMouseLeave?: () => void;
};
