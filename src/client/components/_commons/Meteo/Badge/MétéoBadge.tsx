import { FunctionComponent } from "react";
import { libellésMétéos, Météo } from "@/server/domain/météo/Météo.interface";
import { Badge, BadgeType } from "@/components/_commons/Badge";

interface MétéoBadgeProps {
  météo: Météo;
}

const badgeÀPartirDeLaMétéo: Record<Météo, BadgeType> = {
  ORAGE: "rouge",
  NUAGE: "jaune",
  COUVERT: "bleu",
  SOLEIL: "vert",
  NON_NECESSAIRE: "gris",
  NON_RENSEIGNEE: "gris",
};

const MétéoBadge: FunctionComponent<MétéoBadgeProps> = ({ météo }) => {
  return (
    <Badge type={badgeÀPartirDeLaMétéo[météo]}>{libellésMétéos[météo]}</Badge>
  );
};

export default MétéoBadge;
