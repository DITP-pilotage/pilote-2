import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { FunctionComponent } from "react";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { getContainer } from "@/server/dependances";
import PageHabilitationsCoordinateur from "@/components/PageHabilitationsCoordinateur/PageHabilitationsCoordinateur";
import { pageHabilitationsCoordinateur } from "@/components/PageHabilitationsCoordinateur/PageHabilitationsCoordinateurServerSideContext";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const session = await auth(context);

  if (!session || session.profil !== ProfilEnum.DITP_ADMIN) {
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
