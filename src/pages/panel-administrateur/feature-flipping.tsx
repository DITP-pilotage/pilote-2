import Head from "next/head";
import { GetServerSideProps } from "next";
import { getServerAuthSession } from "@/server/infrastructure/api/auth/[...nextauth]";
import NextPanelAdministrateurLayout from "./layout";

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

const NextPagePanelAdministrateurFeatureFlipping = () => {
  return (
    <>
      <Head>
        <title>Panel Administrateur - Feature flipping - PILOTE</title>
      </Head>
      <NextPanelAdministrateurLayout pageActive="feature-flipping">
        <h2>Feature flipping</h2>
        <p>Contenu à venir...</p>
      </NextPanelAdministrateurLayout>
    </>
  );
};

export default NextPagePanelAdministrateurFeatureFlipping;
