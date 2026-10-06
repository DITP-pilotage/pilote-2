import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { z } from "zod";
import { auth } from "@/server/authentification/infrastructure/nextauth/[...nextauth]";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { getContainer } from "@/server/dependances";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";
import PageAdminEngagementEdition from "@/components/PageAdminEngagements/PageAdminEngagementEdition";

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
  const engagementId = parsed.data;
  const isCreation = query._action === "creer-engagement";
  const container = getContainer("referentiels");

  const engagementData = isCreation
    ? null
    : await container.resolve("getEngagementQuery").run({ engagementId });

  const idSuivant = isCreation
    ? await container.resolve("getNextEngagementIdQuery").run()
    : null;

  return { props: { engagementId, isCreation, engagementData, idSuivant } };
}

const NextPageAdminEngagementEdition = ({
  engagementId,
  isCreation,
  engagementData,
  idSuivant,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => (
  <>
    <Head>
      <title>Panel Administrateur - Engagement {engagementId} - PILOTE</title>
    </Head>
    <NextPanelAdministrateurLayout pageActive="referentiels-deprecies-engagements">
      <PageAdminEngagementEdition
        engagementData={engagementData}
        engagementId={engagementId}
        isCreation={isCreation}
        idSuivant={idSuivant}
      />
    </NextPanelAdministrateurLayout>
  </>
);

export default NextPageAdminEngagementEdition;
