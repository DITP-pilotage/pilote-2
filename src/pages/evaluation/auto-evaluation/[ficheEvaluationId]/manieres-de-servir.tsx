import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { $Enums } from "@prisma/client";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { configurationFeatureFlip } from "@/config";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import { FormulaireAutoEvaluationManieresDeServir } from "@/components/PageAutoEvaluation/manieres-de-servir/FormulaireAutoEvaluationManieresDeServir";
import { pageAutoEvaluationManieresDeServir } from "@/components/PageAutoEvaluation/manieres-de-servir/PageAutoEvaluationManieresDeServirServerSideContext";

export const getServerSideProps = async ({
  req,
  res,
  params,
}: GetServerSidePropsContext) => {
  const session = await getServerSession(req, res, authOptions);
  const ficheEvaluationId = z.string().parse(params?.ficheEvaluationId);

  assert(session);

  const featureFlipping = configurationFeatureFlip();

  const peutAccederEtapeAutoEvaluation = await getContainer("piloteEval")
    .resolve("accesFicheEvaluationService")
    .peutAccederEtapeAutoEvaluation({
      utilisateurId: session.user.id,
      ficheEvaluationId,
    });

  if (
    !featureFlipping.piloteEval ||
    !session.applicationsAccessibles.includes(
      $Enums.application_accessible.PILOTE_EVAL,
    ) ||
    !peutAccederEtapeAutoEvaluation
  ) {
    return {
      redirect: {
        destination: "/404",
      },
    };
  }

  const autoEvaluation = await getContainer("piloteEval")
    .resolve("afficherAutoEvaluation")
    .run({ ficheEvaluationId });

  return { props: { autoEvaluation } };
};

const AutoEvaluationPage = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
  return (
    <pageAutoEvaluationManieresDeServir.ServerSidePropsProvider value={props}>
      <Head>
        <title>PILOTE - Auto-évaluation</title>
      </Head>

      <FormulaireAutoEvaluationManieresDeServir />
    </pageAutoEvaluationManieresDeServir.ServerSidePropsProvider>
  );
};

export default AutoEvaluationPage;
