import { FunctionComponent } from "react";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { BoutonImpression } from "@/components/_commons/BoutonImpression/BoutonImpression";
import { BoutonNavigationFicheConducteur } from "@/components/PageChantier/EnTête/BoutonNavigationFicheConducteur";
import { BoutonNavigationMiseAJourDonnee } from "@/components/PageChantier/EnTête/BoutonNavigationMiseAJourDonnee";

export const ActionChantierEnTete: FunctionComponent<{
  afficheLeBoutonImpression?: boolean;
  afficheLeBoutonMiseAJourDonnee?: boolean;
  afficheLeBoutonFicheConducteur?: boolean;
}> = ({
  afficheLeBoutonImpression = false,
  afficheLeBoutonMiseAJourDonnee = false,
  afficheLeBoutonFicheConducteur = false,
}) => {
  const { chantier } = pageChantier.useServerSidePropsContext();

  const chantierEstArchive = chantier.statut === "ARCHIVE";

  return (
    <div className="hidden lg:block">
      {afficheLeBoutonMiseAJourDonnee ? (
        <div className="flex mb-1">
          <BoutonNavigationMiseAJourDonnee chantierId={chantier.id} />
        </div>
      ) : null}
      {afficheLeBoutonImpression ? (
        <div className="mb-1">
          <BoutonImpression
            className={
              chantierEstArchive
                ? "!text-dsfr-grey-200 !border-dsfr-grey-200"
                : ""
            }
          />
        </div>
      ) : null}
      {afficheLeBoutonFicheConducteur ? (
        <div className="flex mb-1">
          <BoutonNavigationFicheConducteur
            chantierEstArchive={chantierEstArchive}
            chantierId={chantier.id}
          />
        </div>
      ) : null}
    </div>
  );
};
