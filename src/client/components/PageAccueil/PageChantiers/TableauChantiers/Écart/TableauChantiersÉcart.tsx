import { FunctionComponent } from "react";
import { Badge } from "@/components/_commons/Badge/Badge";
import { definirCouleurEcartArrondi } from "@/client/utils/chantier/écart/écart";
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
    <Badge type={estArchive ? "gris" : couleurEcartArrondi.couleur}>
      {couleurEcartArrondi.ecartArrondi.toFixed(1)}
    </Badge>
  );
};

export default TableauChantiersEcart;
