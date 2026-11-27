import Head from "next/head";
import { GetServerSidePropsContext } from "next";
import { auth } from "@/server/authentification/infrastructure/nextauth/[...nextauth]";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";
import { DimensionsMatomoPanel } from "@/components/PagePanelAdministrateur/DimensionsMatomo/DimensionsMatomoPanel";

const redirigerVersAccueil = {
  redirect: { destination: "/", permanent: false },
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await auth(context);
  if (!session) return redirigerVersAccueil;

  const habilitation = new Habilitation({
    habilitations: session.habilitations,
    profil: session.profil,
  });
  if (!habilitation.estAutoriseAAccederALaPageAdmin())
    return redirigerVersAccueil;

  return { props: {} };
}

const NextPagePanelAdministrateurDimensionsMatomo = () => (
  <>
    <Head>
      <title>Panel Administrateur - Dimensions Matomo - PILOTE</title>
    </Head>
    <NextPanelAdministrateurLayout pageActive="dimensions-matomo">
      <DimensionsMatomoPanel />
    </NextPanelAdministrateurLayout>
  </>
);

export default NextPagePanelAdministrateurDimensionsMatomo;
