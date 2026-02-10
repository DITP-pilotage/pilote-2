import Head from "next/head";
import { GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";
import { AlbertChat } from "@/components/PagePanelAdministrateur/Albert/AlbertChat";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await auth(context);
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

const NextPagePanelAdministrateurAlbert = () => {
  return (
    <>
      <Head>
        <title>Panel Administrateur - Albert - PILOTE</title>
      </Head>
      <NextPanelAdministrateurLayout pageActive="albert">
        <AlbertChat />
      </NextPanelAdministrateurLayout>
    </>
  );
};

export default NextPagePanelAdministrateurAlbert;
