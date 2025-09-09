import { BandeauInformationMajDonnees } from "@/components/PageChantier/BandeauInformationMajDonnees";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { BandeauChantierEstArchive } from "@/components/PageChantier/BandeauChantierEstArchive";

export const BandeauEntetePageChantier = ({
  alerteMiseAJourIndicateur,
}: {
  alerteMiseAJourIndicateur: boolean;
}) => {
  const { configurationFeatureFlipping, chantier } =
    pageChantier.useServerSidePropsContext();
  if (
    configurationFeatureFlipping.ppgArchive &&
    chantier.statut === "ARCHIVE"
  ) {
    return <BandeauChantierEstArchive />;
  }
  return (
    <BandeauInformationMajDonnees
      alerteMiseAJourIndicateur={alerteMiseAJourIndicateur}
    />
  );
};
