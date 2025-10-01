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

const NextPagePanelAdministrateurMetadataChantier = () => {
  return (
    <>
      <Head>
        <title>Panel Administrateur - Metadata chantier - PILOTE</title>
      </Head>
      <NextPanelAdministrateurLayout pageActive="metadata-chantier">
        <h2>Metadata chantier</h2>
        <p>Contenu à venir...</p>
      </NextPanelAdministrateurLayout>
    </>
  );
};

export default NextPagePanelAdministrateurMetadataChantier;
