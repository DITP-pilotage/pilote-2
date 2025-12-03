import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { $Enums } from "@prisma/client";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { configurationFeatureFlip } from "@/config";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";

export const getServerSideProps = async ({
  req,
  res,
  params,
}: GetServerSidePropsContext) => {
  const session = await getServerSession(req, res, authOptions);

  assert(session);

  const featureFlipping = configurationFeatureFlip();

  if (
    !featureFlipping.piloteEval ||
    !session.applicationsAccessibles.includes(
      $Enums.application_accessible.PILOTE_EVAL_PILOTAGE,
    )
  ) {
    return {
      redirect: {
        destination: "/404",
      },
    };
  }

  const utilisateurId = params?.id as string;

  const container = getContainer("piloteEval");

  const [criteres, rattachements, objectifsParRattachement] =
    await Promise.all([
      container.resolve("listerCriteresPiloteEval").run(),
      container.resolve("listerRattachementsPiloteEval").run(),
      container.resolve("listerObjectifsParRattachementPiloteEval").run({
        jalon: 2025,
      }),
    ]);

  return {
    props: {
      utilisateurId,
      criteres,
      rattachements,
      objectifsParRattachement,
    },
  };
};

const UtilisateurDetailPage = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  const { utilisateurId, criteres, rattachements, objectifsParRattachement } =
    props;

  return (
    <main className="py-6 pt-0">
      <Head>
        <title>PILOTE - Configuration des droits utilisateur</title>
      </Head>

      <div className="min-h-[60vh] py-12">
        <div className="mx-auto w-full max-w-6xl">
          <header className="mb-6">
            <h1 className="!text-3xl font-bold mb-4">
              Configuration des droits - Utilisateur
            </h1>
            <p className="text-gray-600">ID: {utilisateurId}</p>
          </header>

          <div className="space-y-6">
            <section className="bg-white p-6 rounded shadow-sm">
              <h2 className="!text-2xl font-semibold mb-4">
                Auto-évaluation
              </h2>
              <p className="text-gray-600 mb-4">
                Sélection des territoires pour l'auto-évaluation
              </p>
              <p className="text-sm text-gray-500">
                {rattachements.length} rattachements disponibles
              </p>
            </section>

            <section className="bg-white p-6 rounded shadow-sm">
              <h2 className="!text-2xl font-semibold mb-4">Consolidation</h2>
              <p className="text-gray-600 mb-4">
                Sélection des territoires pour la consolidation
              </p>
              <p className="text-sm text-gray-500">
                {rattachements.length} rattachements disponibles
              </p>
            </section>

            <section className="bg-white p-6 rounded shadow-sm">
              <h2 className="!text-2xl font-semibold mb-4">
                Instruction - Objectifs
              </h2>
              <p className="text-gray-600 mb-4">
                Sélection des territoires pour l'instruction des objectifs
              </p>
              <p className="text-sm text-gray-500">
                {Object.keys(objectifsParRattachement).length} rattachements
                avec objectifs
              </p>
            </section>

            <section className="bg-white p-6 rounded shadow-sm">
              <h2 className="!text-2xl font-semibold mb-4">
                Instruction - Manière de servir
              </h2>
              <p className="text-gray-600 mb-4">
                Sélection des axes pour l'instruction de la manière de servir
              </p>
              <p className="text-sm text-gray-500">
                {criteres.length} critères disponibles
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default UtilisateurDetailPage;
