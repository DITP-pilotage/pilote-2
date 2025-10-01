import Head from "next/head";
import { GetServerSideProps } from "next";
import { getServerAuthSession } from "@/server/infrastructure/api/auth/[...nextauth]";
import { FormulaireParametrageSourceIndicateur } from "@/components/PagePanelAdministrateur/ParametrageSourceIndicateur/FormulaireParametrageSourceIndicateur";
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

const NextPagePanelAdministrateurParametrageSourceIndicateur = () => {
  return (
    <>
      <Head>
        <title>
          Panel administrateur - Paramétrage source indicateur - PILOTE
        </title>
      </Head>
      <NextPanelAdministrateurLayout pageActive="parametrage-source-indicateur">
        <FormulaireParametrageSourceIndicateur />
      </NextPanelAdministrateurLayout>
    </>
  );
};

export default NextPagePanelAdministrateurParametrageSourceIndicateur;
