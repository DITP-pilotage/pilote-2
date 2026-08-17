import Head from "next/head";
import { GetServerSidePropsContext } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";
import PageAdminPorteurs from "@/components/PageAdminPorteurs/PageAdminPorteurs";

const redirigerVersAccueil = { redirect: { destination: "/", permanent: false } };

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await auth(context);
  if (!session) return redirigerVersAccueil;

  const habilitation = new Habilitation({
    habilitations: session.habilitations,
    profil: session.profil,
  });
  if (!habilitation.estAutoriseAAccederALaPageAdmin()) return redirigerVersAccueil;

  return { props: {} };
}

const NextPageAdminPorteurs = () => (
  <>
    <Head>
      <title>Panel Administrateur - Porteurs - PILOTE</title>
    </Head>
    <NextPanelAdministrateurLayout pageActive="referentiels-porteurs">
      <PageAdminPorteurs />
    </NextPanelAdministrateurLayout>
  </>
);

export default NextPageAdminPorteurs;
