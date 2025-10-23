import BadgeIcône from "@/components/_commons/BadgeIcône/BadgeIcône";
import { useIndicateurAlerteDateMaj } from "@/components/_commons/IndicateursChantier/Bloc/useIndicateurAlerteDateMaj";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";

export const BadgeIndicateurEnAlerte = () => {
  const { chantier } = useBlocIndicateurContext();
  const { estIndicateurEnAlerte } = useIndicateurAlerteDateMaj();

  if (!estIndicateurEnAlerte || chantier.statut === "ARCHIVE") return null;

  return (
    <span className="fr-mr-1v">
      <BadgeIcône type="warning" />
    </span>
  );
};
