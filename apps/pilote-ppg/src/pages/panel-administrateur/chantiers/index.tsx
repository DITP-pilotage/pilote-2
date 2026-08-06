import Head from "next/head";
import { GetServerSidePropsContext } from "next";
import { FunctionComponent } from "react";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";
import PageAdminChantiers from "@/components/PageAdminChantiers/PageAdminChantiers";

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

const NextPageAdminChantiers: FunctionComponent = () => (
  <>
    <Head>
      <title>Panel Administrateur - Gestion des chantiers - PILOTE</title>
    </Head>
    <NextPanelAdministrateurLayout pageActive="metadata-chantier">
      <PageAdminChantiers />
    </NextPanelAdministrateurLayout>
  </>
);

export default NextPageAdminChantiers;
