import Head from "next/head";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { pageEvaluation } from "@/components/PageEvaluation/PageEvaluationServerSideContext";
import { configurationFeatureFlip } from "@/config";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import { ApplicationAccessible } from "@/server/domain/utilisateur/Utilisateur.interface";
import { FormulaireEvaluation } from "@/components/PageEvaluation/FormulaireEvaluation";

export const getServerSideProps = async ({
  req,
  res,
  params,
}: GetServerSidePropsContext) => {
  const session = await getServerSession(req, res, authOptions);
  const ficheEvaluationId = z.string().parse(params?.ficheEvaluationId);

  assert(session);

  const featureFlipping = configurationFeatureFlip();

  const peutAccederFicheAutoEvaluation = await getContainer("piloteEval")
    .resolve("accesFicheEvaluationService")
    .peutAccederFicheAutoEvaluation({
      utilisateurId: session.user.id,
      ficheEvaluationId,
    });

  if (
    !featureFlipping.piloteEval ||
    !session.applicationsAccessibles.includes(
      ApplicationAccessible.PILOTE_EVAL,
    ) ||
    peutAccederFicheAutoEvaluation
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
    <pageEvaluation.ServerSidePropsProvider value={props}>
      <Head>
        <title>PILOTE - Auto-évaluation</title>
      </Head>

      <FormulaireEvaluation />
    </pageEvaluation.ServerSidePropsProvider>
  );
};

export default AutoEvaluationPage;
