import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { $Enums } from "@prisma/client";
import assert from "node:assert";
import { configurationFeatureFlip } from "@/config";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import { prisma } from "@/server/db/prisma";

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

  const rattachements = await prisma.referentiel_rattachement.findMany({
    where: {
      rattachement_utilisateur_etape_jalon: {
        some: {
          utilisateur_id: session.user.id,
          etape: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
        },
      },
    },
    select: {
      code: true,
    },
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
