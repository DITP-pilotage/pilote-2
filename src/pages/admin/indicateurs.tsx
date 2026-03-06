import Head from "next/head";
import { GetServerSidePropsContext } from "next";
import { FunctionComponent } from "react";
import PageAdminIndicateurs from "@/components/PageAdminIndicateurs/PageAdminIndicateurs";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { estAutoriséAModifierDesIndicateurs } from "@/client/utils/indicateur/indicateur";

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
        <title>Gestion des indicateurs - PILOTE</title>
      </Head>
      <PageAdminIndicateurs />
    </>
  );
};

export default NextPageIndicateurs;
