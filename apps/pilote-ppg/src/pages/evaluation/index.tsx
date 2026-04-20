import { GetServerSidePropsContext } from "next";
import { $Enums } from "@prisma/client";
import assert from "node:assert";
import { configurationFeatureFlip } from "@/config";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";

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

  return {
    redirect: {
      destination: `/evaluation/accueil`,
    },
  };
};

const EvaluationIndexPage = () => null;

export default EvaluationIndexPage;
