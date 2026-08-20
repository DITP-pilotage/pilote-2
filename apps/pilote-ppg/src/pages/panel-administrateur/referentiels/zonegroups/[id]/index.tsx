import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { z } from "zod";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
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
  const estUneCréation = query._action === "creer-zonegroup";
  const container = getContainer("metadataZonegroup");

  const zonegroupData = estUneCréation
    ? null
    : await container.resolve("recupererZonegroupQuery").run({ zoneGroupId });

  const idSuivant = estUneCréation
    ? await container.resolve("recupererIdSuivantZonegroupQuery").run()
    : null;

  return { props: { zoneGroupId, estUneCréation, zonegroupData, idSuivant } };
}

const NextPageAdminZonegroupEdition = ({
  zoneGroupId,
  estUneCréation,
  zonegroupData,
  idSuivant,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => (
  <>
    <Head>
      <title>Panel Administrateur - Zone groupe {zoneGroupId} - PILOTE</title>
    </Head>
    <NextPanelAdministrateurLayout pageActive="referentiels-zonegroups">
      <PageAdminZonegroupEdition
        estUneCréation={estUneCréation}
        idSuivant={idSuivant}
        zonegroupData={zonegroupData}
        zoneGroupId={zoneGroupId}
      />
    </NextPanelAdministrateurLayout>
  </>
);

export default NextPageAdminZonegroupEdition;
