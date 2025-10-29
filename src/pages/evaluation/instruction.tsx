import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { $Enums } from "@prisma/client";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import { pageInstruction } from "@/components/PageInstruction/PageInstructionServerSideContext";
import { FormulaireInstruction } from "@/components/PageInstruction/FormulaireInstruction";
import { configurationFeatureFlip } from "@/config";

export const getServerSideProps = async ({
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await getServerSession(req, res, authOptions);
  assert(session);

  const featureFlipping = configurationFeatureFlip();

  const peutAccederEtapeInstruction = await getContainer("piloteEval")
    .resolve("accesFicheEvaluationService")
    .peutAccederEtapeInstruction({
      utilisateurId: session.user.id,
    });

  if (
    !featureFlipping.piloteEval ||
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
    <div className="mx-auto w-full max-w-[1200px] py-6">
      <pageInstruction.ServerSidePropsProvider value={props}>
        <FormulaireInstruction />
      </pageInstruction.ServerSidePropsProvider>
    </div>
  );
}
