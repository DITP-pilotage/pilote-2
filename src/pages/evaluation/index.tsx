import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { $Enums } from "@prisma/client";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { configurationFeatureFlip } from "@/config";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import { ListeAutoEvaluations } from "@/components/Evaluation/ListeAutoEvaluations";

export const getServerSideProps = async ({
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await getServerSession(req, res, authOptions);

  assert(session);

  const featureFlipping = configurationFeatureFlip();

  if (
    !featureFlipping.piloteEval ||
    !session.applicationsAccessibles.includes(
      $Enums.application_accessible.PILOTE_EVAL,
    )
  ) {
    return {
      redirect: {
        destination: "/404",
      },
    };
  }

  const fichesEvaluation = await getContainer("piloteEval")
    .resolve("listerFichesAutoEvaluation")
    .run({ utilisateurId: session.user.id });

  return { props: { fichesEvaluation } };
};

const EvaluationPage = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  const { fichesEvaluation } = props;

  return (
    <main className="py-6 pt-0">
      <Head>
        <title>PILOTE - Évaluation</title>
      </Head>

      <div className="min-h-[60vh] py-12">
        <div className="mx-auto w-full max-w-6xl">
          <header className="mb-6">
            <h1 className="!text-3xl font-bold mb-2">
              Bienvenue sur votre espace d'auto-évaluation
            </h1>
            <p className="text-gray-600">
              Cet espace vous permet de renseigner vos auto-évaluations et de
              suivre vos objectifs collectifs.
            </p>
          </header>

          <ListeAutoEvaluations fichesEvaluation={fichesEvaluation} />

          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-white rounded shadow">
              <header className="p-4 bg-dsfr-blue-france-925 border-b-2 border-black">
                <span className="font-bold text-sm">Consolidation</span>
              </header>
              <div className="p-4">
                <Link
                  className="text-blue-600 hover:underline"
                  href="/evaluation/consolidation"
                >
                  Accéder à la consolidation
                </Link>
              </div>
            </div>

            <div className="bg-white rounded shadow">
              <header className="p-4 bg-dsfr-blue-france-925 border-b-2 border-black">
                <span className="font-bold text-sm">Instruction</span>
              </header>
              <div className="p-4">
                <Link
                  className="text-blue-600 hover:underline"
                  href="/evaluation/instruction"
                >
                  Accéder à l'instruction
                </Link>
              </div>
            </div>

            <div className="bg-white rounded shadow">
              <header className="p-4 bg-dsfr-blue-france-925 border-b-2 border-black">
                <span className="font-bold text-sm">Pilotage</span>
              </header>
              <div className="p-4">
                <Link
                  className="text-blue-600 hover:underline"
                  href="/evaluation/pilotage"
                >
                  Accéder au pilotage
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default EvaluationPage;
