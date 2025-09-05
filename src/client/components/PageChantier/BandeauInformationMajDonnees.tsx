export const BandeauInformationMajDonnees = ({
  alerteMiseAJourIndicateur,
}: {
  alerteMiseAJourIndicateur: boolean;
}) => {
  if (!alerteMiseAJourIndicateur) return null;

  return (
    <div className="fr-notice fr-notice--info fr-notice--warning !bg-dsfr-warning-950 !text-dsfr-warning-425 w-full">
      <div className="fr-notice__body flex fr-mx-3w">
        <p className="fr-notice__desc fr-ml-1v">
          <span className="fr-text--bold">
            Mise à jour des données requises :{" "}
          </span>
          un ou plusieurs indicateurs de cette politique prioritaire nécessitent
          au moins une mise à jour de leur valeur d'avancement par l'équipe
          projet.
        </p>
      </div>
    </div>
  );
};
