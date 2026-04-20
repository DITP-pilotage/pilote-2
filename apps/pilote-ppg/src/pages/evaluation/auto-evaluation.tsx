import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { $Enums } from "@prisma/client";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { configurationFeatureFlip } from "@/config";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { ListeAutoEvaluations } from "@/components/Evaluation/ListeAutoEvaluation/ListeAutoEvaluations";

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const session = await auth(context);

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
              Bienvenue sur votre espace d'auto-évaluation 2025
            </h1>
            <h2 className="!text-2xl !text-primary">Calendrier</h2>
            <div className="text-gray-600">
              <p className="!mb-0">
                La phase d'auto-évaluation des objectifs individuels et de la
                manière de servir est ouverte jusqu'à la fin du mois de janvier
                2026.
              </p>
              <p className="!mb-0">
                À l'échéance qui vous a été fixée, les auto-évaluations
                incomplètes ou non validées seront automatiquement validées.
              </p>
              <p className="!mb-0">
                Les objectifs collectifs ne font pas l'objet d'une
                auto-évaluation et sont mis à disposition à titre informatif.
                Ils seront évalués à partir des résultats constatés dans PILOTE.
              </p>
            </div>
          </header>

          <ListeAutoEvaluations fichesEvaluation={fichesEvaluation} />
        </div>
      </div>
    </main>
  );
};

export default EvaluationPage;
