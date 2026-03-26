import Head from "next/head";
import { GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";
import { PagePanelAdministrateurFeatureFlipping } from "@/components/PagePanelAdministrateur/PagePanelAdministrateurFeatureFlipping/PagePanelAdministrateurFeatureFlipping";

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

const NextPagePanelAdministrateurFeatureFlipping = () => {
  return (
    <>
      <Head>
        <title>Panel Administrateur - Feature flipping - PILOTE</title>
      </Head>
      <NextPanelAdministrateurLayout pageActive="feature-flipping">
        <div className="p-6">
          <h2 className="text-lg font-bold text-dsfr-blue-france-sun-113 mb-1">
            Feature flipping
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Activez ou désactivez les fonctionnalités de l&apos;application. Les
            modifications sont prises en compte immédiatement après sauvegarde.
          </p>
          <PagePanelAdministrateurFeatureFlipping />
        </div>
      </NextPanelAdministrateurLayout>
    </>
  );
};

export default NextPagePanelAdministrateurFeatureFlipping;
