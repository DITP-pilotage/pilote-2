import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { z } from "zod";
import { auth } from "@/server/authentification/infrastructure/nextauth/[...nextauth]";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { getContainer } from "@/server/dependances";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";
import PageAdminAxeEdition from "@/components/PageAdminAxes/PageAdminAxeEdition";

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
  const parsed = z.string().min(1).safeParse(params?.id);
  if (!parsed.success) return redirigerVersAccueil;
  const axeId = parsed.data;
  const isCreation = query._action === "creer-axe";

  const axeData = isCreation
    ? null
    : await getContainer("referentiels").resolve("getAxeQuery").run({ axeId });

  return { props: { axeId, isCreation, axeData } };
}

const NextPageAdminAxeEdition = ({
  axeId,
  isCreation,
  axeData,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => (
  <>
    <Head>
      <title>Panel Administrateur - Axe {axeId} - PILOTE</title>
    </Head>
    <NextPanelAdministrateurLayout pageActive="referentiels-deprecies-axes">
      <PageAdminAxeEdition
        axeData={axeData}
        axeId={axeId}
        isCreation={isCreation}
      />
    </NextPanelAdministrateurLayout>
  </>
);

export default NextPageAdminAxeEdition;
