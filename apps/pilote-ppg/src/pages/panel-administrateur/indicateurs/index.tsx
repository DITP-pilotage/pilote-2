import Head from "next/head";
import { GetServerSidePropsContext } from "next";
import { FunctionComponent } from "react";
import PageAdminIndicateurs from "@/components/PageAdminIndicateurs/PageAdminIndicateurs";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { estAutoriséAModifierDesIndicateurs } from "@/client/utils/indicateur/indicateur";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const redirigerVersPageAccueil = {
    redirect: {
      destination: "/",
      permanent: false,
    },
  };

  const session = await auth(context);
  if (!session || !estAutoriséAModifierDesIndicateurs(session.profil)) {
    return redirigerVersPageAccueil;
  }

  return {
    props: {},
  };
}

const NextPageIndicateurs: FunctionComponent = () => {
  return (
    <>
      <Head>
        <title>Panel Administrateur - Gestion des indicateurs - PILOTE</title>
      </Head>
      <NextPanelAdministrateurLayout pageActive="indicateurs">
        <PageAdminIndicateurs />
      </NextPanelAdministrateurLayout>
    </>
  );
};

export default NextPageIndicateurs;
