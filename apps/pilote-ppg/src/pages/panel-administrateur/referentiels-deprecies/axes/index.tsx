import Head from "next/head";
import { GetServerSidePropsContext } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";
import PageAdminAxes from "@/components/PageAdminAxes/PageAdminAxes";

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

const NextPageAdminAxes = () => (
  <>
    <Head>
      <title>Panel Administrateur - Axes - PILOTE</title>
    </Head>
    <NextPanelAdministrateurLayout pageActive="referentiels-deprecies-axes">
      <PageAdminAxes />
    </NextPanelAdministrateurLayout>
  </>
);

export default NextPageAdminAxes;
