import "@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css";
import "@gouvfr/dsfr/dist/utility/icons/icons-document/icons-document.min.css";
import "@gouvfr/dsfr/dist/dsfr.min.css";
import Link from "next/link";
import { FunctionComponent } from "react";
import clsx from "clsx";
import BoutonImpression from "@/components/_commons/BoutonImpression/BoutonImpression";
import Titre from "@/components/_commons/Titre/Titre";
import { ResponsableRapportDetailleContrat } from "@/server/chantiers/app/contrats/ChantierRapportDetailleContrat";
import { getQueryParamString } from "@/client/utils/getQueryParamString";
import { estLargeurDÉcranActuelleMoinsLargeQue } from "@/client/stores/useLargeurDÉcranStore/useLargeurDÉcranStore";
import { getFiltresActifs } from "@/client/stores/useFiltresStoreNew/useFiltresStoreNew";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { IconeMinistere } from "@/client/utils/mapperIconeMinistereVersIcone";
import { GovernmentIcon } from "@/components/_commons/Icones/GovernmentIcon";
import { AccountIcon } from "@/components/_commons/Icones/AccountIcon";
import PageChantierEnTêteStyled from "./EnTête.styled";
import { ResponsableChantierEnTete } from "./EnTêteResponsables";
import { ResponsabiliteChantierEnTete } from "./ResponsabiliteChantierEnTete";

interface PageChantierEnTêteProps {
  responsables?: ResponsableRapportDetailleContrat;
  afficheLeBoutonImpression?: boolean;
  afficheLeBoutonMiseAJourDonnee?: boolean;
  afficheLeBoutonFicheConducteur?: boolean;
}

const PageChantierEnTête: FunctionComponent<PageChantierEnTêteProps> = ({
  responsables,
  afficheLeBoutonImpression = false,
  afficheLeBoutonMiseAJourDonnee = false,
  afficheLeBoutonFicheConducteur = false,
}) => {
  const { chantier, territoireCode } = pageChantier.useServerSidePropsContext();

  const estVueMobile = estLargeurDÉcranActuelleMoinsLargeQue("sm");
  const listeNomsResponsablesMinistèrePorteur: string[] = [
    responsables?.porteur?.nom,
  ].filter(Boolean);
  const listeNomsResponsablesAutresMinistèresCoPorteurs = (
    responsables?.coporteurs || []
  )
    .map((coporteur) => coporteur.nom)
    .filter(Boolean);
  const listeNomsDirecteursAdministrationCentrale = (
    responsables?.directeursAdminCentrale || []
  )
    .map(
      (directeurAdminCentrale) =>
        `${directeurAdminCentrale.nom}  (${directeurAdminCentrale.direction})`,
    )
    .filter(Boolean);

  const queryParamString = getQueryParamString(getFiltresActifs());
  const hrefBoutonRetour = `/accueil/chantier/${territoireCode}${queryParamString.length > 0 ? `?${queryParamString}` : ""}`;

  const nomChantier =
    chantier.nom.length > 50 ? `${chantier.nom.slice(0, 50)}...` : chantier.nom;

  const chantierEstArchive = chantier.statut === "ARCHIVE";
  return (
    <PageChantierEnTêteStyled
      className={clsx("fr-text-title--blue-france", {
        "!text-dsfr-grey-200": chantierEstArchive,
      })}
    >
      <Link
        aria-label="Retour à l'accueil"
        className={clsx(
          "fr-link fr-fi-arrow-left-line fr-link--icon-left fr-mb-3w fr-mt-2w btn-retour",
          {
            "!text-dsfr-grey-200": chantierEstArchive,
          },
        )}
        href={hrefBoutonRetour}
      >
        Retour
      </Link>
      <div className="container-titre-chantier">
        <Titre
          baliseHtml="h1"
          className={clsx("fr-h2 fr-mb-2w fr-mt-1w titre-chantier", {
            "!text-dsfr-grey-200": chantierEstArchive,
          })}
        >
          {nomChantier}
        </Titre>
      </div>
      <div className="fr-pb-3w fr-mb-3w border-b border-blue-france flex">
        <div className="icone-entete fr-mb-1w fr-pr-1w">
          <IconeMinistere icone={responsables?.porteur?.icône} />
        </div>
        <p className={clsx(`fr-mb-0 uppercase`)}>
          {listeNomsResponsablesMinistèrePorteur.join(", ") || "Non renseigné"}
        </p>
      </div>
      <ResponsableChantierEnTete
        icone={GovernmentIcon}
        libellé="Autres ministères co-porteurs"
        listeNomsResponsables={listeNomsResponsablesAutresMinistèresCoPorteurs}
      />
      <ResponsableChantierEnTete
        icone={AccountIcon}
        libellé="Directeur(s) / directrice(s) d'Administration Centrale"
        listeNomsResponsables={listeNomsDirecteursAdministrationCentrale}
      />
      <ResponsabiliteChantierEnTete />
      <div className="fr-mt-md-2w format-mobile fr-ml-1w">
        {afficheLeBoutonMiseAJourDonnee && !estVueMobile ? (
          <div className="fr-mb-1v">
            <Link
              className="lien-menu fr-link fr-link--icon-left fr-icon-download-line fr-btn--icon-left fr-text--sm fr-p-0 no-underline border-b border-blue-france"
              href={`/chantier/${chantier.id}/indicateurs`}
              title="Mettre à jour les données"
            >
              Mettre à jour les données
            </Link>
          </div>
        ) : null}
        {afficheLeBoutonImpression && !estVueMobile ? (
          <div className="format-mobile-bouton-impression fr-mb-1v">
            <BoutonImpression
              className={chantierEstArchive ? "!text-dsfr-grey-200" : ""}
            />
          </div>
        ) : null}
        {afficheLeBoutonFicheConducteur && !estVueMobile ? (
          <Link
            className={clsx(
              "lien-menu fr-link fr-link--icon-left fr-icon-article-line fr-btn--icon-left fr-text--sm fr-p-0 no-underline border-b border-blue-france",
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
    </PageChantierEnTêteStyled>
  );
};

export default PageChantierEnTête;
