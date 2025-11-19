import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { $Enums } from "@prisma/client";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { configurationFeatureFlip } from "@/config";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";

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

  const utilisateurId = session.user.id;
  const fichesEvaluation = await getContainer("piloteEval")
    .resolve("listerFichesAutoEvaluation")
    .run({ utilisateurId: utilisateurId });
  const accesFicheEvaluationService = getContainer("piloteEval").resolve(
    "accesFicheEvaluationService",
  );

  if (fichesEvaluation.length > 0) {
    return {
      redirect: {
        destination: `/evaluation/auto-evaluation`,
      },
    };
  }

  if (
    await accesFicheEvaluationService.peutAccederEtapeAppreciation({
      utilisateurId,
    })
  )
    return {
      redirect: {
        destination: `/evaluation/appreciation`,
      },
    };

  if (
    await accesFicheEvaluationService.peutAccederEtapeInstruction({
      utilisateurId,
    })
  )
    return {
      redirect: {
        destination: `/evaluation/instruction`,
      },
    };

  if (
    await accesFicheEvaluationService.peutAccederEtapePilotage({
      applicationsAccessibles: session.applicationsAccessibles,
    })
  )
    return {
      redirect: {
        destination: `/evaluation/pilotage`,
      },
    };

  return { props: {} };
};

const EvaluationIndexPage = () => null;

export default EvaluationIndexPage;
