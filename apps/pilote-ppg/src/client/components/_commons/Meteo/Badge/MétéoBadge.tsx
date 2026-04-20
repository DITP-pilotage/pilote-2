import { FunctionComponent } from "react";
import { libellesMeteos, Meteo } from "@/server/domain/météo/Météo.interface";
import { Badge, BadgeType } from "@/components/_commons/Badge";

interface MétéoBadgeProps {
  météo: Meteo;
}

const badgeÀPartirDeLaMétéo: Record<Meteo, BadgeType> = {
  ORAGE: "rouge",
  NUAGE: "jaune",
  COUVERT: "bleu",
  SOLEIL: "vert",
  NON_NECESSAIRE: "gris",
  NON_RENSEIGNEE: "gris",
};

const MétéoBadge: FunctionComponent<MétéoBadgeProps> = ({ météo }) => {
  return (
    <Badge type={badgeÀPartirDeLaMétéo[météo]}>{libellesMeteos[météo]}</Badge>
  );
};

export default MétéoBadge;
