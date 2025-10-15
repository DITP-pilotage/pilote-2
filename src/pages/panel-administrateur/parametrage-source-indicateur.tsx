import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { FunctionComponent } from "react";
import { getServerAuthSession } from "@/server/infrastructure/api/auth/[...nextauth]";
import { FormulaireParametrageSourceIndicateur } from "@/components/PagePanelAdministrateur/ParametrageSourceIndicateur/FormulaireParametrageSourceIndicateur";
import { pageParametrageSourceContext } from "@/components/PagePanelAdministrateur/ParametrageSourceIndicateur/PageParametrageSourceContext";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { mockMetadataIndicateurs } from "@/components/PagePanelAdministrateur/ParametrageSourceIndicateur/mockData";
import NextPanelAdministrateurLayout from "./layout";

export const getServerSideProps = async ({
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await getServerAuthSession({ req, res });

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const habilitation = new Habilitation({
    habilitations: session.habilitations,
    profil: session.profil,
  });

  if (!habilitation.estAutoriseAAccederALaPageAdmin()) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      listeMetadonneesIndicateur: mockMetadataIndicateurs,
    },
  };
};

const NextPagePanelAdministrateurParametrageSourceIndicateur: FunctionComponent<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = (props) => {
  return (
    <pageParametrageSourceContext.ServerSidePropsProvider value={props}>
      <Head>
        <title>
          Panel administrateur - Paramétrage source indicateur - PILOTE
        </title>
      </Head>
      <NextPanelAdministrateurLayout pageActive="parametrage-source-indicateur">
        <FormulaireParametrageSourceIndicateur />
      </NextPanelAdministrateurLayout>
    </pageParametrageSourceContext.ServerSidePropsProvider>
  );
};

export default NextPagePanelAdministrateurParametrageSourceIndicateur;
