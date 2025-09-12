import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import { formaterDate } from "@/client/utils/date/date";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import useIndicateurAlerteDateMaj from "@/components/_commons/IndicateursChantier/Bloc/useIndicateurAlerteDateMaj";

export const LigneIndicateurDatePrevisionnelle = () => {
  const { chantier, detailIndicateurDuTerritoire } = useBlocIndicateurContext();
  const { estIndicateurEnAlerte } = useIndicateurAlerteDateMaj(
    !!detailIndicateurDuTerritoire.estAJour,
    !!detailIndicateurDuTerritoire.est_applicable,
  );

  if (chantier.statut === "ARCHIVE") return null;

  const indicateurEstApplicable = detailIndicateurDuTerritoire.est_applicable;
  const dateProchaineDateMaj =
    formaterDate(detailIndicateurDuTerritoire.prochaineDateMaj, "MM/YYYY") ??
    null;

  return (
    <div
      className={`flex align-center w-full relative${estIndicateurEnAlerte ? " fr-text-warning" : " texte-gris"}`}
    >
      <p className="!mb-0 fr-text--xs pr-1">
        Date prévisionnelle de la prochaine mise à jour des données (de
        l'indicateur) :{" "}
        <span className="fr-text--bold">
          {indicateurEstApplicable
            ? (dateProchaineDateMaj ??
              "Données requises mais non renseignées par l'équipe projet")
            : "Non applicable"}
        </span>
      </p>
      <Infobulle
        classNameBouton="infobulle-date-previsionnelle"
        classNameInfoBulle="tooltip-accordeon"
      >
        <p className="fr-text--sm fr-text-title--blue-france">
          Date prévisionnelle de mise à jour de l'indicateur :
        </p>
        <p className="fr-text--sm fr-mb-0">
          Elle est calculée à partir de la date de la valeur d'avancement, de la
          période de mise à jour et du délai de disponibilité des données. Plus
          d'informations dans l'accordéon "Description de l'indicateur et
          calendrier de mise à jour".
        </p>
      </Infobulle>
    </div>
  );
};
