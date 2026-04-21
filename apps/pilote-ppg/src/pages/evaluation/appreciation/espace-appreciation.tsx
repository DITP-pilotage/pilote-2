import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { $Enums } from "@prisma/client";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { pageEspaceAppreciation } from "@/components/PageEspaceAppreciation/PageEspaceAppreciationServerSideContext";
import { FormulaireAppreciation } from "@/components/PageEspaceAppreciation/FormulaireAppreciation";

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const session = await auth(context);
  assert(session);

  const featureFlips = await getContainer("legacy")
    .resolve("recupererFeatureFlipsUseCase")
    .run();

  const peutAccederEtapeConsolidation = await getContainer("piloteEval")
    .resolve("accesFicheEvaluationService")
    .peutAccederEtapeAppreciation({
      utilisateurId: session.user.id,
    });

  if (
    !featureFlips["NEXT_PUBLIC_FF_PILOTE_EVAL"] ||
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

export default function PageEspaceAppreciation(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  return (
    <pageEspaceAppreciation.ServerSidePropsProvider value={props}>
      <FormulaireAppreciation />
    </pageEspaceAppreciation.ServerSidePropsProvider>
  );
}
