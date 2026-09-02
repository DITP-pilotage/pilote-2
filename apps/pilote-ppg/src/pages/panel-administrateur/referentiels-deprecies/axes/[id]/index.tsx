import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { z } from "zod";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
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
  const estUneCréation = query._action === "creer-axe";

  const axeData = estUneCréation
    ? null
    : await getContainer("metadataAxe")
        .resolve("recupererAxeQuery")
        .run({ axeId });

  return { props: { axeId, estUneCréation, axeData } };
}

const NextPageAdminAxeEdition = ({
  axeId,
  estUneCréation,
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
        estUneCréation={estUneCréation}
      />
    </NextPanelAdministrateurLayout>
  </>
);

export default NextPageAdminAxeEdition;
