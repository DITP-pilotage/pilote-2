import { FunctionComponent } from "react";
import { Badge } from "@/components/shared/Badge";
import {
  definirCouleurEcartArrondi,
  VARIANTE_BADGE_ECART,
} from "@/client/utils/chantier/écart/écart";
import { DonneesComparaisonDuTauxDAvancementType } from "@/server/domain/territoire/Territoire.interface";

interface EcartTauxAvancementPPGProps {
  ecart: DonneesComparaisonDuTauxDAvancementType["ppgEcartMedian"];
  estArchive?: boolean;
}

const EcartTauxAvancementPPG: FunctionComponent<
  EcartTauxAvancementPPGProps
> = ({ ecart, estArchive }) => {
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
      {`${couleurEcartArrondi.commentaire} : ${couleurEcartArrondi.ecartArrondi.toFixed(1)}`}
    </Badge>
  );
};

export default EcartTauxAvancementPPG;
