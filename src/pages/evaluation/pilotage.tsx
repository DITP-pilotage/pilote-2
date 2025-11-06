import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { $Enums } from "@prisma/client";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { pagePilotage } from "@/components/PagePilotage/PagePilotageServerSideContext";
import { TableauPilotage } from "@/components/PagePilotage/TableauPilotage";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import { configurationFeatureFlip } from "@/config";

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
      $Enums.application_accessible.PILOTE_EVAL_PILOTAGE,
    )
  ) {
    return {
      redirect: {
        destination: "/404",
      },
    };
  }

  return {
    props: {
      pilotage: await getContainer("piloteEval")
        .resolve("afficherPilotageQuery")
        .run(),
    },
  };
};

export default function PagePilotage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  return (
    <pagePilotage.ServerSidePropsProvider value={props}>
      <div className="mx-auto w-full max-w-[1600px] py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Pilotage des évaluations</h1>
      </div>
      <div className="py-6 px-4">
        <TableauPilotage />
      </div>
    </pagePilotage.ServerSidePropsProvider>
  );
}
