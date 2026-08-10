import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { FunctionComponent } from "react";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";
import PageAdminChantierEdition from "@/components/PageAdminChantiers/PageAdminChantierEdition";

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
  return {
    props: {
      chantierId: params!.id,
      estUneCréation: query._action === "creer-chantier",
      modificationReussie: query._action === "modification-reussie",
      creationReussie: query._action === "creation-reussie",
    },
  };
}

const NextPageAdminChantierEdition: FunctionComponent<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ chantierId, estUneCréation, modificationReussie, creationReussie }) => (
  <>
    <Head>
      <title>Panel Administrateur - Chantier {chantierId} - PILOTE</title>
    </Head>
    <NextPanelAdministrateurLayout pageActive="metadata-chantier">
      <PageAdminChantierEdition
        chantierId={chantierId}
        creationReussie={creationReussie}
        estUneCréation={estUneCréation}
        modificationReussie={modificationReussie}
      />
    </NextPanelAdministrateurLayout>
  </>
);

export default NextPageAdminChantierEdition;
