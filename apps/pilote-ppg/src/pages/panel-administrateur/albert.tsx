import Head from "next/head";
import { GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";
import { AlbertPanel } from "@/components/PagePanelAdministrateur/Albert/AlbertPanel";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

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
  if (session.profil !== ProfilEnum.DITP_ADMIN) {
    return redirigerVersPageAccueil;
  }

  return { props: {} };
};

const NextPagePanelAdministrateurAlbert = () => {
  return (
    <>
      <Head>
        <title>Panel Administrateur - Albert - PILOTE</title>
      </Head>
      <NextPanelAdministrateurLayout pageActive="albert">
        <AlbertPanel />
      </NextPanelAdministrateurLayout>
    </>
  );
};

export default NextPagePanelAdministrateurAlbert;
