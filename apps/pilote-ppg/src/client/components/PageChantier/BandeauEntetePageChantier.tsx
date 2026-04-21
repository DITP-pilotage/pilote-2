import { BandeauInformationMajDonnees } from "@/components/PageChantier/BandeauInformationMajDonnees";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { BandeauChantierEstArchive } from "@/components/PageChantier/BandeauChantierEstArchive";
import { useEnv } from "@/client/hooks/useEnv";

export const BandeauEntetePageChantier = ({
  alerteMiseAJourIndicateur,
}: {
  alerteMiseAJourIndicateur: boolean;
}) => {
  const { chantier } = pageChantier.useServerSidePropsContext();
  const ppgArchive = useEnv("NEXT_PUBLIC_FF_PPG_ARCHIVE");
  if (ppgArchive && chantier.statut === "ARCHIVE") {
    return <BandeauChantierEstArchive />;
  }
  return (
    <BandeauInformationMajDonnees
      alerteMiseAJourIndicateur={alerteMiseAJourIndicateur}
    />
  );
};
