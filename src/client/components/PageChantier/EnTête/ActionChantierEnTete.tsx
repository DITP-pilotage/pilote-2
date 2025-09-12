import "@gouvfr/dsfr/dist/utility/icons/icons-document/icons-document.min.css";
import { FunctionComponent } from "react";
import Link from "next/link";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { estLargeurDÉcranActuelleMoinsLargeQue } from "@/stores/useLargeurDÉcranStore/useLargeurDÉcranStore";
import BoutonImpression from "@/components/_commons/BoutonImpression/BoutonImpression";
import { clsxm } from "@/utils/clsxm";

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

  const estVueMobile = estLargeurDÉcranActuelleMoinsLargeQue("sm");

  if (estVueMobile) return null;

  return (
    <div className="fr-mt-md-2w format-mobile fr-ml-1w">
      {afficheLeBoutonMiseAJourDonnee ? (
        <div className="fr-mb-1v">
          <Link
            className="fr-link fr-link--icon-left fr-icon-download-line fr-btn--icon-left fr-text--sm fr-p-0 no-underline"
            href={`/chantier/${chantier.id}/indicateurs`}
            title="Mettre à jour les données"
          >
            Mettre à jour les données
          </Link>
        </div>
      ) : null}
      {afficheLeBoutonImpression ? (
        <div className="format-mobile-bouton-impression fr-mb-1v">
          <BoutonImpression
            className={chantierEstArchive ? "!text-dsfr-grey-200" : ""}
          />
        </div>
      ) : null}
      {afficheLeBoutonFicheConducteur ? (
        <Link
          className={clsxm(
            "fr-link fr-link--icon-left fr-icon-article-line fr-btn--icon-left fr-text--sm fr-p-0 no-underline",
            {
              "!text-dsfr-grey-200": chantierEstArchive,
            },
          )}
          href={`/chantier/${chantier.id}/fiche-conducteur`}
          title="Fiche conducteur"
        >
          Fiche conducteur
        </Link>
      ) : null}
    </div>
  );
};
