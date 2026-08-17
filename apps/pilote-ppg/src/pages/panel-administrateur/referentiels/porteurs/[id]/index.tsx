import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { getContainer } from "@/server/dependances";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";
import PageAdminPorteurEdition from "@/components/PageAdminPorteurs/PageAdminPorteurEdition";

const redirigerVersAccueil = { redirect: { destination: "/", permanent: false } };

export async function getServerSideProps(
  context: GetServerSidePropsContext<{ id: string }>,
) {
  const session = await auth(context);
  if (!session) return redirigerVersAccueil;

  const habilitation = new Habilitation({
    habilitations: session.habilitations,
    profil: session.profil,
  });
  if (!habilitation.estAutoriseAAccederALaPageAdmin()) return redirigerVersAccueil;

  const { params, query } = context;
  const porteurId = params!.id;
  const estUneCréation = query._action === "creer-porteur";
  const container = getContainer("metadataPorteur");

  const porteurData = estUneCréation
    ? null
    : await container.resolve("recupererPorteurQuery").run({ porteurId });

  const idSuivant = estUneCréation
    ? await container.resolve("recupererIdSuivantPorteurQuery").run()
    : null;

  return { props: { porteurId, estUneCréation, porteurData, idSuivant } };
}

const NextPageAdminPorteurEdition = ({
  porteurId,
  estUneCréation,
  porteurData,
  idSuivant,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => (
  <>
    <Head>
      <title>Panel Administrateur - Porteur {porteurId} - PILOTE</title>
    </Head>
    <NextPanelAdministrateurLayout pageActive="referentiels-porteurs">
      <PageAdminPorteurEdition
        estUneCréation={estUneCréation}
        idSuivant={idSuivant}
        porteurData={porteurData}
        porteurId={porteurId}
      />
    </NextPanelAdministrateurLayout>
  </>
);

export default NextPageAdminPorteurEdition;
