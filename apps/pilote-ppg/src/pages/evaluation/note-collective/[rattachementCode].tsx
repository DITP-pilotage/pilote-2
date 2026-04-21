import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { z } from "zod";
import { $Enums } from "@prisma/client";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { configuration } from "@/config";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { pageNoteCollective } from "@/components/Evaluation/PageNoteCollectiveServerSideContext";
import { ContenuPageNoteCollective } from "@/components/PageNoteCollective/PageNoteCollective";

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const { params } = context;
  const session = await auth(context);
  const rattachementCode = z.string().parse(params?.rattachementCode);

  assert(session);

  const featureFlips = await getContainer("legacy")
    .resolve("recupererFeatureFlipsUseCase")
    .run();
  const container = getContainer("piloteEval");

  const peutAccederEtapeAutoEvaluation = await container
    .resolve("accesFicheEvaluationService")
    .peutAccederEtapeAutoEvaluationRattachement({
      utilisateurId: session.user.id,
      rattachementCode,
    });

  if (
    !featureFlips["NEXT_PUBLIC_FF_PILOTE_EVAL"] ||
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

  const rattachements = await container
    .resolve("getRattachementPourEtapeQuery")
    .run({
      utilisateurId: session.user.id,
      etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
    });

  const chantiersEvaluation = await container
    .resolve("recupererDetailsNoteCollectiveQuery")
    .run({ rattachementCode, jalon: 2025 });

  const baseUrl = configuration().baseUrl;

  return {
    props: {
      chantiersEvaluation,
      rattachements,
      rattachementCode,
      baseUrl,
    },
  };
};

export default function PageDetailsNoteCollective(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  return (
    <pageNoteCollective.ServerSidePropsProvider value={props}>
      <ContenuPageNoteCollective />
    </pageNoteCollective.ServerSidePropsProvider>
  );
}
