import { Notice } from "@/components/shared/Notice";

export const BandeauInformationMajDonnees = ({
  alerteMiseAJourIndicateur,
}: {
  alerteMiseAJourIndicateur: boolean;
}) => {
  if (!alerteMiseAJourIndicateur) return null;

  return (
    <Notice
      containerClassName="px-6"
      title="Mise à jour des données requises :"
      variant="warning"
    >
      un ou plusieurs indicateurs de cette politique prioritaire nécessitent au
      moins une mise à jour de leur valeur d'avancement par l'équipe projet.
    </Notice>
  );
};
