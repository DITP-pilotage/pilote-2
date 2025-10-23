import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { $Enums } from "@prisma/client";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import { pageConsolidation } from "@/components/PageConsolidation/PageConsolidationServerSideContext";
import { FormulaireConsolidation } from "@/components/PageConsolidation/FormulaireConsolidation";
import { configurationFeatureFlip } from "@/config";

export const getServerSideProps = async ({
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await getServerSession(req, res, authOptions);
  assert(session);

  const featureFlipping = configurationFeatureFlip();

  const peutAccederEtapeConsolidation = await getContainer("piloteEval")
    .resolve("accesFicheEvaluationService")
    .peutAccederEtapeConsolidation({
      utilisateurId: session.user.id,
    });

  if (
    !featureFlipping.piloteEval ||
    !session.applicationsAccessibles.includes(
      $Enums.application_accessible.PILOTE_EVAL,
    ) ||
    !peutAccederEtapeConsolidation
  ) {
    return {
      redirect: {
        destination: "/404",
      },
    };
  }

  return {
    props: await getContainer("piloteEval")
      .resolve("afficherConsolidationQuery")
      .run({ utilisateurId: session.user.id }),
  };
};

export default function PageConsolidation(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  return (
    <div className="mx-auto w-full max-w-[1200px] py-6">
      <pageConsolidation.ServerSidePropsProvider value={props}>
        <FormulaireConsolidation />
      </pageConsolidation.ServerSidePropsProvider>
    </div>
  );
}
