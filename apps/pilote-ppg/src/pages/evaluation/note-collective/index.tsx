import { GetServerSidePropsContext } from "next";
import { $Enums } from "@prisma/client";
import assert from "node:assert";
import { configurationFeatureFlip } from "@/config";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { getContainer } from "@/server/dependances";

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

  const rattachements = await getContainer("piloteEval")
    .resolve("getRattachementPourEtapeQuery")
    .run({
      utilisateurId: session.user.id,
      etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
    });

  if (rattachements[0]) {
    return {
      redirect: {
        destination: `/evaluation/note-collective/${rattachements[0].code}`,
        permanent: false,
      },
    };
  }

  return {
    redirect: {
      destination: "/404",
    },
  };
};

export default function NoteCollectivePage() {
  return null;
}
