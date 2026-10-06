import Head from "next/head";
import { z } from "zod";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { auth } from "@/server/authentification/infrastructure/nextauth/[...nextauth]";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { getContainer } from "@/server/dependances";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";
import PageAdminChantierEdition from "@/components/PageAdminChantiers/PageAdminChantierEdition";

const redirigerVersAccueil = {
  redirect: { destination: "/", permanent: false },
};

export async function getServerSideProps(
  context: GetServerSidePropsContext<{ id: string }>,
) {
  const session = await auth(context);
  if (!session) return redirigerVersAccueil;

  const habilitation = new Habilitation({
    habilitations: session.habilitations,
    profil: session.profil,
  });
  if (!habilitation.estAutoriseAAccederALaPageAdmin())
    return redirigerVersAccueil;

  const { params, query } = context;
  const chantierId = z.string().parse(params?.id);
  const isCreation = query._action === "creer-chantier";

  const container = getContainer("parametrageChantier");

  const chantierData = isCreation
    ? null
    : await container.resolve("getChantierQuery").run({ chantierId });

  const ponderations = isCreation
    ? null
    : await container
        .resolve("getIndicateursPonderationsChantierQuery")
        .run({ chantierId });

  const idSuivant = isCreation
    ? await container.resolve("getNextIdQuery").run()
    : null;

  return {
    props: {
      chantierId,
      isCreation,
      chantierData,
      ponderations,
      idSuivant,
    },
  };
}

const NextPageAdminChantierEdition = ({
  chantierId,
  isCreation,
  chantierData,
  ponderations,
  idSuivant,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => (
  <>
    <Head>
      <title>Panel Administrateur - Chantier {chantierId} - PILOTE</title>
    </Head>
    <NextPanelAdministrateurLayout pageActive="metadata-chantier">
      <PageAdminChantierEdition
        chantierId={chantierId}
        chantierData={chantierData}
        isCreation={isCreation}
        idSuivant={idSuivant}
        ponderations={ponderations}
      />
    </NextPanelAdministrateurLayout>
  </>
);

export default NextPageAdminChantierEdition;
