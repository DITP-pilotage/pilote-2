import BadgeIcône from "@/components/_commons/BadgeIcône/BadgeIcône";
import useIndicateurAlerteDateMaj from "@/components/_commons/IndicateursChantier/Bloc/useIndicateurAlerteDateMaj";

export const BadgeIndicateurEnAlerte = ({
  indicateurNonAJour,
  indicateurEstApplicable,
}: {
  indicateurNonAJour: boolean;
  indicateurEstApplicable: boolean;
}) => {
  const { estIndicateurEnAlerte } = useIndicateurAlerteDateMaj(
    indicateurNonAJour,
    indicateurEstApplicable,
  );

  return estIndicateurEnAlerte ? (
    <span className="fr-mr-1v">
      <BadgeIcône type="warning" />
    </span>
  ) : null;
};
