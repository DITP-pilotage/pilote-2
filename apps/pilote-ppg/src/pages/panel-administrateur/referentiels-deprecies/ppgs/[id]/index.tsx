import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { z } from "zod";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { getContainer } from "@/server/dependances";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";
import PageAdminPpgEdition from "@/components/PageAdminPpgs/PageAdminPpgEdition";

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
  const ppgId = parsed.data;
  const estUneCréation = query._action === "creer-ppg";

  const ppgData = estUneCréation
    ? null
    : await getContainer("metadataPpg")
        .resolve("recupererPpgQuery")
        .run({ ppgId });

  return { props: { ppgId, estUneCréation, ppgData } };
}

const NextPageAdminPpgEdition = ({
  ppgId,
  estUneCréation,
  ppgData,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => (
  <>
    <Head>
      <title>Panel Administrateur - PPG {ppgId} - PILOTE</title>
    </Head>
    <NextPanelAdministrateurLayout pageActive="referentiels-deprecies-ppgs">
      <PageAdminPpgEdition
        estUneCréation={estUneCréation}
        ppgData={ppgData}
        ppgId={ppgId}
      />
    </NextPanelAdministrateurLayout>
  </>
);

export default NextPageAdminPpgEdition;
