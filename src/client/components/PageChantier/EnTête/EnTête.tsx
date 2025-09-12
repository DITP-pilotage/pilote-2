import "@gouvfr/dsfr/dist/dsfr.min.css";
import Link from "next/link";
import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { ResponsableRapportDetailleContrat } from "@/server/chantiers/app/contrats/ChantierRapportDetailleContrat";
import { getQueryParamString } from "@/client/utils/getQueryParamString";
import { getFiltresActifs } from "@/client/stores/useFiltresStoreNew/useFiltresStoreNew";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { IconeMinistere } from "@/client/utils/mapperIconeMinistereVersIcone";
import { GovernmentIcon } from "@/components/_commons/Icones/GovernmentIcon";
import { AccountIcon } from "@/components/_commons/Icones/AccountIcon";
import { clsxm } from "@/utils/clsxm";
import { ActionChantierEnTete } from "@/components/PageChantier/EnTête/ActionChantierEnTete";
import { ResponsableChantierEnTete } from "./EnTêteResponsables";
import { ResponsabiliteChantierEnTete } from "./ResponsabiliteChantierEnTete";

const PageChantierEnTête: FunctionComponent<{
  responsables?: ResponsableRapportDetailleContrat;
  afficheLeBoutonImpression?: boolean;
  afficheLeBoutonMiseAJourDonnee?: boolean;
  afficheLeBoutonFicheConducteur?: boolean;
}> = ({
  responsables,
  afficheLeBoutonImpression = false,
  afficheLeBoutonMiseAJourDonnee = false,
  afficheLeBoutonFicheConducteur = false,
}) => {
  const { chantier, territoireCode } = pageChantier.useServerSidePropsContext();

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
    <div
      className={clsxm("fr-text-title--blue-france print:mt-4", {
        "!text-dsfr-grey-200": chantierEstArchive,
      })}
    >
      <Link
        aria-label="Retour à l'accueil"
        className="fr-link fr-fi-arrow-left-line fr-link--icon-left fr-mb-3w fr-mt-2w !text-dsfr-blue-france-sun-113"
        href={hrefBoutonRetour}
      >
        Retour
      </Link>
      <Titre
        baliseHtml="h1"
        className={clsxm("fr-h2 !mb-4 !mt-2 !text-dsfr-blue-france-sun-113", {
          "!text-dsfr-grey-200": chantierEstArchive,
        })}
      >
        {nomChantier}
      </Titre>
      <div className="!pb-6 !mb-6 border-b border-blue-france flex">
        <div className="icone-entete fr-mb-1w fr-pr-1w">
          <IconeMinistere icone={responsables?.porteur?.icône} />
        </div>
        <p className={clsxm(`fr-mb-0 uppercase`)}>
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
      <ActionChantierEnTete
        afficheLeBoutonFicheConducteur={afficheLeBoutonFicheConducteur}
        afficheLeBoutonImpression={afficheLeBoutonImpression}
        afficheLeBoutonMiseAJourDonnee={afficheLeBoutonMiseAJourDonnee}
      />
    </div>
  );
};

export default PageChantierEnTête;
