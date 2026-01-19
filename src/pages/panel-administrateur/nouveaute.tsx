import Head from "next/head";
import { GetServerSideProps } from "next";
import { getServerAuthSession } from "@/server/infrastructure/api/auth/[...nextauth]";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getServerAuthSession({ req, res });
  const redirigerVersPageAccueil = {
    redirect: {
      destination: "/",
      permanent: false,
    },
  };

  if (!session) {
    return redirigerVersPageAccueil;
  }

  return {
    props: {},
  };
};

const NextPagePanelAdministrateurNouveaute = () => {
  return (
    <>
      <Head>
        <title>Panel Administrateur - Nouveauté - PILOTE</title>
      </Head>
      <NextPanelAdministrateurLayout pageActive="nouveaute">
        <h2>Nouveauté</h2>
        <p>Contenu à venir...</p>
      </NextPanelAdministrateurLayout>
    </>
  );
};

export default NextPagePanelAdministrateurNouveaute;
