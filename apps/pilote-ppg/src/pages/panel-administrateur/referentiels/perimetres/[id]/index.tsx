import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import Habilitation from "@/server/gestion-utilisateur/domain/habilitation/Habilitation";
import { getContainer } from "@/server/dependances";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";
import PageAdminPerimetreEdition from "@/components/PageAdminPerimetres/PageAdminPerimetreEdition";

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
  const perimetreId = params!.id;
  const estUneCréation = query._action === "creer-perimetre";
  const container = getContainer("metadataPerimetre");

  const perimetreData = estUneCréation
    ? null
    : await container.resolve("recupererPerimetreQuery").run({ perimetreId });

  const idSuivant = estUneCréation
    ? await container.resolve("recupererIdSuivantPerimetreQuery").run()
    : null;

  return { props: { perimetreId, estUneCréation, perimetreData, idSuivant } };
}

const NextPageAdminPerimetreEdition = ({
  perimetreId,
  estUneCréation,
  perimetreData,
  idSuivant,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => (
  <>
    <Head>
      <title>Panel Administrateur - Périmètre {perimetreId} - PILOTE</title>
    </Head>
    <NextPanelAdministrateurLayout pageActive="referentiels-perimetres">
      <PageAdminPerimetreEdition
        estUneCréation={estUneCréation}
        idSuivant={idSuivant}
        perimetreData={perimetreData}
        perimetreId={perimetreId}
      />
    </NextPanelAdministrateurLayout>
  </>
);

export default NextPageAdminPerimetreEdition;
