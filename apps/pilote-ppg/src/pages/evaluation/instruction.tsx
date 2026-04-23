import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { $Enums } from "@prisma/client";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { pageInstruction } from "@/components/PageInstruction/PageInstructionServerSideContext";
import { FormulaireInstruction } from "@/components/PageInstruction/FormulaireInstruction";

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const session = await auth(context);
  assert(session);

  const featureFlips = await getContainer("legacy")
    .resolve("recupererFeatureFlipsUseCase")
    .run();

  const peutAccederEtapeInstruction = await getContainer("piloteEval")
    .resolve("accesFicheEvaluationService")
    .peutAccederEtapeInstruction({
      utilisateurId: session.user.id,
    });

  if (
    !featureFlips["NEXT_PUBLIC_FF_PILOTE_EVAL"] ||
    !session.applicationsAccessibles.includes(
      $Enums.application_accessible.PILOTE_EVAL,
    ) ||
    !peutAccederEtapeInstruction
  ) {
    return {
      redirect: {
        destination: "/404",
      },
    };
  }

  return {
    props: await getContainer("piloteEval")
      .resolve("afficherInstructionQuery")
      .execute({ utilisateurId: session.user.id }),
  };
};

export default function PageInstruction(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  return (
    <pageInstruction.ServerSidePropsProvider value={props}>
      <FormulaireInstruction />
    </pageInstruction.ServerSidePropsProvider>
  );
}
