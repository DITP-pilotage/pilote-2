import { FunctionComponent } from "react";
import { libellesMeteos, Meteo } from "@/server/domain/météo/Météo.interface";
import { Badge, BadgeVariant } from "@/components/shared/Badge";

interface MétéoBadgeProps {
  météo: Meteo;
}

const badgeÀPartirDeLaMétéo: Record<Meteo, BadgeVariant> = {
  ORAGE: "error",
  NUAGE: "green-tilleul",
  COUVERT: "info",
  SOLEIL: "success",
  NON_NECESSAIRE: "default",
  NON_RENSEIGNEE: "default",
};

const MétéoBadge: FunctionComponent<MétéoBadgeProps> = ({ météo }) => {
  return (
    <Badge size="sm" variant={badgeÀPartirDeLaMétéo[météo]}>
      {libellesMeteos[météo]}
    </Badge>
  );
};

export default MétéoBadge;
