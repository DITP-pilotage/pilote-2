import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { z } from "zod";
import { auth } from "@/server/authentification/infrastructure/nextauth/[...nextauth]";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { getContainer } from "@/server/dependances";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";
import PageAdminZonegroupEdition from "@/components/PageAdminZonegroups/PageAdminZonegroupEdition";

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
  const zoneGroupId = parsed.data;
  const isCreation = query._action === "creer-zonegroup";
  const container = getContainer("referentiels");

  const zonegroupData = isCreation
    ? null
    : await container.resolve("getZonegroupQuery").run({ zoneGroupId });

  const idSuivant = isCreation
    ? await container.resolve("getNextZonegroupIdQuery").run()
    : null;

  return { props: { zoneGroupId, isCreation, zonegroupData, idSuivant } };
}

const NextPageAdminZonegroupEdition = ({
  zoneGroupId,
  isCreation,
  zonegroupData,
  idSuivant,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => (
  <>
    <Head>
      <title>Panel Administrateur - Zone groupe {zoneGroupId} - PILOTE</title>
    </Head>
    <NextPanelAdministrateurLayout pageActive="referentiels-zonegroups">
      <PageAdminZonegroupEdition
        isCreation={isCreation}
        idSuivant={idSuivant}
        zonegroupData={zonegroupData}
        zoneGroupId={zoneGroupId}
      />
    </NextPanelAdministrateurLayout>
  </>
);

export default NextPageAdminZonegroupEdition;
