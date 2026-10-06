import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { FunctionComponent } from "react";
import { auth } from "@/server/authentification/infrastructure/nextauth/[...nextauth]";
import { FormulaireParametrageSourceIndicateur } from "@/components/PagePanelAdministrateur/ParametrageSourceIndicateur/FormulaireParametrageSourceIndicateur";
import { pageParametrageSourceContext } from "@/components/PagePanelAdministrateur/ParametrageSourceIndicateur/PageParametrageSourceContext";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { getContainer } from "@/server/dependances";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const session = await auth(context);

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

  const { listeMetadonneesIndicateur } = await getContainer(
    "parametrageIndicateur",
  )
    .resolve("getMetadataIndicateurConfigurationQuery")
    .run();

  return {
    props: {
      listeMetadonneesIndicateur,
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
      <NextPanelAdministrateurLayout pageActive="parametrage-metadata-indicateur">
        <FormulaireParametrageSourceIndicateur />
      </NextPanelAdministrateurLayout>
    </pageParametrageSourceContext.ServerSidePropsProvider>
  );
};

export default NextPagePanelAdministrateurParametrageSourceIndicateur;
