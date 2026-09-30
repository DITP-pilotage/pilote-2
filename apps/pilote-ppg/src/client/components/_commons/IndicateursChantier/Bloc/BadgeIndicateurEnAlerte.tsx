import { useIndicateurAlerteDateMaj } from "@/components/_commons/IndicateursChantier/Bloc/useIndicateurAlerteDateMaj";
import { WarningIcon } from "@/components/_commons/Icones/WarningIcon";
import { Badge } from "@/components/shared/Badge";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";

export const BadgeIndicateurEnAlerte = () => {
  const { chantier } = useBlocIndicateurContext();
  const { estIndicateurEnAlerte } = useIndicateurAlerteDateMaj();

  if (!estIndicateurEnAlerte || chantier.statut === "ARCHIVE") return null;

  return (
    <span className="fr-mr-1v">
      <Badge
        aria-hidden="true"
        className="px-1"
        icone={WarningIcon}
        variante="attention"
      />
    </span>
  );
};
