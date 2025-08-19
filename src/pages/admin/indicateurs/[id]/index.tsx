import { GetServerSidePropsContext } from "next/types";
import Head from "next/head";
import { FunctionComponent } from "react";
import { getServerAuthSession } from "@/server/infrastructure/api/auth/[...nextauth]";
import Utilisateur from "@/server/domain/utilisateur/Utilisateur.interface";
import {
  MetadataParametrageIndicateurContrat,
  presenterEnMetadataParametrageIndicateurContrat,
} from "@/server/app/contrats/MetadataParametrageIndicateurContrat";
import PageIndicateur from "@/components/PageIndicateur/PageIndicateur";
import {
  MapInformationMetadataIndicateurContrat,
  presenterEnMapInformationMetadataIndicateurContrat,
} from "@/server/app/contrats/InformationMetadataIndicateurContrat";
import { ChantierSynthétisé } from "@/server/domain/chantier/Chantier.interface";
import { getContainer } from "@/server/dependances";
import { InformationHistorisationMetadataIndicateurContrat } from "@/server/parametrage-indicateur/app/InformationDerniereModificationMetadataIndicateurContrat";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";

export interface NextPageAdminUtilisateurProps {
  indicateur: MetadataParametrageIndicateurContrat;
  informationHistorisationIndicateur: InformationHistorisationMetadataIndicateurContrat;
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat;
  estUneCréation: boolean;
  modificationReussie: boolean;
  creationReussie: boolean;
  chantiers: ChantierSynthétisé[];
}

export async function getServerSideProps({
  req,
  res,
  params,
  query,
}: GetServerSidePropsContext<{
  id: Utilisateur["id"];
  _action?: string;
}>) {
  const redirigerVersPageAccueil = {
    redirect: {
      destination: "/",
      permanent: false,
    },
  };

  const session = await getServerAuthSession({ req, res });

  if (!params?.id || !session || !session.habilitations) {
    return redirigerVersPageAccueil;
  }

  const habilitations = await getContainer("gestionUtilisateur")
    .resolve("habilitationService")
    .recupererHabilitations(session);

  habilitations.verifierAutorisationLectureMetadataIndicateur(session.profil);

  let indicateurDemandé: MetadataParametrageIndicateurContrat;
  let creationReussie = query._action === "creation-reussie";
  let modificationReussie = query._action === "modification-reussie";
  let estUneCréation = query._action === "creer-indicateur";
  if (estUneCréation) {
    indicateurDemandé = presenterEnMetadataParametrageIndicateurContrat(
      await getContainer("parametrageIndicateur")
        .resolve("initialiserNouvelIndicateurUseCase")
        .run(params.id),
    );
  } else {
    indicateurDemandé = presenterEnMetadataParametrageIndicateurContrat(
      await getContainer("parametrageIndicateur")
        .resolve("récupérerUnIndicateurUseCase")
        .run(params.id),
    );
    if (!indicateurDemandé) {
      return redirigerVersPageAccueil;
    }
  }

  const informationHistorisationIndicateur = await getContainer(
    "parametrageIndicateur",
  )
    .resolve("metadataParametrageIndicateurQuery")
    .recupererInformationHistorisation({ indicId: params.id });

  const chantiers = await getContainer("gestionUtilisateur")
    .resolve("recupererChantiersSynthetisesUseCase")
    .run({
      listeChantierIdLecture: session.habilitations.lecture.chantiers,
    });

  const mapInformationMetadataIndicateur =
    presenterEnMapInformationMetadataIndicateurContrat(
      getContainer("parametrageIndicateur")
        .resolve("récupérerInformationMetadataIndicateurUseCase")
        .run(),
    );

  return {
    props: {
      indicateur: indicateurDemandé,
      informationHistorisationIndicateur,
      mapInformationMetadataIndicateur,
      chantiers,
      estUneCréation,
      creationReussie,
      modificationReussie,
    },
  };
}

const NextPageAdminIndicateur: FunctionComponent<
  NextPageAdminUtilisateurProps
> = ({
  indicateur,
  informationHistorisationIndicateur,
  mapInformationMetadataIndicateur,
  estUneCréation,
  modificationReussie,
  creationReussie,
  chantiers,
}) => {
  return (
    <>
      <Head>
        <title>Indicateur {indicateur.indicId}- PILOTE</title>
      </Head>
      <PageIndicateur
        chantiers={chantiers}
        creationReussie={creationReussie}
        estUneCréation={estUneCréation}
        indicateur={indicateur}
        informationHistorisationIndicateur={informationHistorisationIndicateur}
        mapInformationMetadataIndicateur={mapInformationMetadataIndicateur}
        modificationReussie={modificationReussie}
      />
    </>
  );
};

export default NextPageAdminIndicateur;
