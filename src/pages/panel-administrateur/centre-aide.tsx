import Head from "next/head";
import { GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";
import { PagePanelAdministrateurCentreAide } from "@/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/PagePanelAdministrateurCentreAide";
import { configurationFeatureFlip } from "@/config";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await auth(context);
  const redirigerVersPageAccueil = {
    redirect: {
      destination: "/",
      permanent: false,
    },
  };

  if (!session || !configurationFeatureFlip().centreAideCustomPilote) {
    return redirigerVersPageAccueil;
  }

  return {
    props: {},
  };
};

const NextPagePanelAdministrateurCentreAide = () => {
  return (
    <>
      <Head>
        <title>Panel Administrateur - Centre d&apos;aide - PILOTE</title>
      </Head>
      <NextPanelAdministrateurLayout pageActive="centre-aide">
        <PagePanelAdministrateurCentreAide />
      </NextPanelAdministrateurLayout>
    </>
  );
};

export default NextPagePanelAdministrateurCentreAide;
