import { FunctionComponent } from "react";
import Badge from "@/components/_commons/Badge/Badge";
import { definirCouleurEcartArrondi } from "@/client/utils/chantier/écart/écart";
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
    <Badge type={estArchive ? "gris" : couleurEcartArrondi.couleur}>
      <p className="fr-text--xs fr-mr-1v">{couleurEcartArrondi.commentaire}</p>:
      <p className="fr-text--xs fr-ml-1v">
        {couleurEcartArrondi.ecartArrondi.toFixed(1)}
      </p>
    </Badge>
  );
};

export default EcartTauxAvancementPPG;
