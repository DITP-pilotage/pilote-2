import { FunctionComponent } from "react";
import { libellesMeteos, Meteo } from "@/server/domain/météo/Météo.interface";
import { Badge, VarianteBadge } from "@/components/shared/Badge";

interface MétéoBadgeProps {
  météo: Meteo;
}

const badgeÀPartirDeLaMétéo: Record<Meteo, VarianteBadge> = {
  ORAGE: "erreur",
  NUAGE: "vert-tilleul",
  COUVERT: "info",
  SOLEIL: "succes",
  NON_NECESSAIRE: "defaut",
  NON_RENSEIGNEE: "defaut",
};

const MétéoBadge: FunctionComponent<MétéoBadgeProps> = ({ météo }) => {
  return (
    <Badge taille="sm" variante={badgeÀPartirDeLaMétéo[météo]}>
      {libellesMeteos[météo]}
    </Badge>
  );
};

export default MétéoBadge;
