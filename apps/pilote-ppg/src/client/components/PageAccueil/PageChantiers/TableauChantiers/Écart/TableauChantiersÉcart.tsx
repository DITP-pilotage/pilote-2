import { FunctionComponent } from "react";
import { Badge } from "@/components/shared/Badge";
import {
  definirCouleurEcartArrondi,
  VARIANTE_BADGE_ECART,
} from "@/client/utils/chantier/écart/écart";
import { DonnéesTableauChantiers } from "@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface";

interface TableauChantiersEcartProps {
  ecart: DonnéesTableauChantiers["écart"];
  estArchive?: boolean;
}

const TableauChantiersEcart: FunctionComponent<TableauChantiersEcartProps> = ({
  ecart,
  estArchive,
}) => {
  const couleurEcartArrondi = definirCouleurEcartArrondi(ecart);

  if (couleurEcartArrondi === null) {
    return null;
  }

  return (
    <Badge
      taille="sm"
      variante={
        estArchive
          ? "defaut"
          : VARIANTE_BADGE_ECART[couleurEcartArrondi.couleur]
      }
    >
      {couleurEcartArrondi.ecartArrondi.toFixed(1)}
    </Badge>
  );
};

export default TableauChantiersEcart;
