import Head from "next/head";
import { z } from "zod";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
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
  const estUneCréation = query._action === "creer-chantier";

  const container = getContainer("metadataChantier");

  const chantierData = estUneCréation
    ? null
    : await container.resolve("recupererChantierQuery").run({ chantierId });

  const ponderations = estUneCréation
    ? null
    : await container
        .resolve("recupererIndicateursPonderationsChantierQuery")
        .run({ chantierId });

  const idSuivant = estUneCréation
    ? await container.resolve("recupererIdSuivantQuery").run()
    : null;

  return {
    props: {
      chantierId,
      estUneCréation,
      chantierData,
      ponderations,
      idSuivant,
    },
  };
}

const NextPageAdminChantierEdition = ({
  chantierId,
  estUneCréation,
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
        estUneCréation={estUneCréation}
        idSuivant={idSuivant}
        ponderations={ponderations}
      />
    </NextPanelAdministrateurLayout>
  </>
);

export default NextPageAdminChantierEdition;
