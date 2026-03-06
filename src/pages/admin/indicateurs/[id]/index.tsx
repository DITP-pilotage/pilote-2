import { GetServerSidePropsContext } from "next/types";
import Head from "next/head";
import { FunctionComponent } from "react";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
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

export interface NextPageAdminUtilisateurProps {
  indicateur: MetadataParametrageIndicateurContrat;
  informationHistorisationIndicateur: InformationHistorisationMetadataIndicateurContrat;
  mapInformationMetadataIndicateur: MapInformationMetadataIndicateurContrat;
  estUneCréation: boolean;
  chantiers: ChantierSynthétisé[];
}

export async function getServerSideProps(
  context: GetServerSidePropsContext<{
    id: Utilisateur["id"];
    _action?: string;
  }>,
) {
  const { params, query } = context;
  const redirigerVersPageAccueil = {
    redirect: {
      destination: "/",
      permanent: false,
    },
  };

  const session = await auth(context);

  if (!params?.id || !session || !session.habilitations) {
    return redirigerVersPageAccueil;
  }

  const habilitations = await getContainer("gestionUtilisateur")
    .resolve("habilitationService")
    .recupererHabilitations(session);

  habilitations.verifierAutorisationLectureMetadataIndicateur();

  let indicateurDemandé: MetadataParametrageIndicateurContrat;
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
      await getContainer("parametrageIndicateur")
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
  chantiers,
}) => {
  return (
    <>
      <Head>
        <title>Indicateur {indicateur.indicId}- PILOTE</title>
      </Head>
      <PageIndicateur
        chantiers={chantiers}
        estUneCréation={estUneCréation}
        indicateur={indicateur}
        informationHistorisationIndicateur={informationHistorisationIndicateur}
        mapInformationMetadataIndicateur={mapInformationMetadataIndicateur}
      />
    </>
  );
};

export default NextPageAdminIndicateur;
