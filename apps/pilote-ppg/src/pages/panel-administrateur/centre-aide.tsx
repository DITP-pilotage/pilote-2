import Head from "next/head";
import { GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";
import { PagePanelAdministrateurCentreAide } from "@/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/PagePanelAdministrateurCentreAide";
import { useEnv } from "@/client/hooks/useEnv";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await auth(context);

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

const NextPagePanelAdministrateurCentreAide = () => {
  const ffCentreAideAdmin = useEnv("NEXT_PUBLIC_FF_CENTRE_AIDE_ADMIN");

  if (!ffCentreAideAdmin) {
    return null;
  }

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
