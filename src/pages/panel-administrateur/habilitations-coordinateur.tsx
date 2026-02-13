import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { FunctionComponent } from "react";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { getContainer } from "@/server/dependances";
import PageHabilitationsCoordinateur from "@/components/PageHabilitationsCoordinateur/PageHabilitationsCoordinateur";
import { pageHabilitationsCoordinateur } from "@/components/PageHabilitationsCoordinateur/PageHabilitationsCoordinateurServerSideContext";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { configurationFeatureFlip } from "@/config";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const session = await auth(context);

  const featureFlipping = configurationFeatureFlip();

  if (!featureFlipping.panelAdmin) {
    return {
      redirect: {
        destination: "/404",
      },
    };
  }

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const habilitation = new Habilitation({
    habilitations: session.habilitations,
    profil: session.profil,
  });

  if (!habilitation.estAutoriseAAccederALaPageAdmin()) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const chantiers = await getContainer("habilitationsCoordinateur")
    .resolve("recupererLesChantiersTerritorialisesQuery")
    .run();

  return {
    props: {
      chantiers,
    },
  };
};

const NextPageHabilitationsCoordinateur: FunctionComponent<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = (props) => {
  return (
    <pageHabilitationsCoordinateur.ServerSidePropsProvider value={props}>
      <Head>
        <title>
          Panel Administrateur - Habilitations coordinateurs - PILOTE
        </title>
      </Head>
      <NextPanelAdministrateurLayout pageActive="habilitations-coordinateur">
        <PageHabilitationsCoordinateur />
      </NextPanelAdministrateurLayout>
    </pageHabilitationsCoordinateur.ServerSidePropsProvider>
  );
};

export default NextPageHabilitationsCoordinateur;
