import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getServerSession } from "next-auth/next";
import { $Enums } from "@prisma/client";
import Head from "next/head";
import { useState } from "react";
import assert from "node:assert";
import { getContainer } from "@/server/dependances";
import { authOptions } from "@/server/infrastructure/api/auth/[...nextauth]";
import { configurationFeatureFlip } from "@/config";
import { pageAppreciation } from "@/components/PageAppreciation/PageAppreciationServerSideContext";
import { InformationEnteteAppreciation } from "@/components/PageAppreciation/InformationEnteteAppreciation";
import { SelecteurPhaseAppreciation } from "@/components/PageAppreciation/SelecteurPhaseAppreciation";
import { ListePhaseEvaluation } from "@/components/PageAppreciation/ListePhaseEvaluation";

export const getServerSideProps = async ({
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await getServerSession(req, res, authOptions);
  assert(session);

  const featureFlipping = configurationFeatureFlip();

  const container = getContainer("piloteEval");

  const peutAccederEtapeConsolidation = await container
    .resolve("accesFicheEvaluationService")
    .peutAccederEtapeAppreciation({
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

  const fichesParGroupePuisPhase = await container
    .resolve("listerFichesEvaluationParPhaseQuery")
    .run({ utilisateurId: session.user.id });

  return {
    props: {
      fichesParGroupePuisPhase,
    },
  };
};

export default function PageAppreciation(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const nombreInstruction = Object.values(
    props.fichesParGroupePuisPhase,
  ).flatMap((groupe) => groupe.INSTRUCTION).length;
  const nombreAppreciation = Object.values(
    props.fichesParGroupePuisPhase,
  ).flatMap((groupe) => groupe.CONSOLIDATION).length;
  const nombreAutoEvaluation = Object.values(
    props.fichesParGroupePuisPhase,
  ).flatMap((groupe) => groupe.AUTO_EVALUATION).length;
  const nombreTotal =
    nombreInstruction + nombreAppreciation + nombreAutoEvaluation;
  const appreciationTerminee = nombreTotal === nombreInstruction;
  const appreciationEnCours = nombreAppreciation > 0;
  const autoEvaluationEnCours = nombreAutoEvaluation > 0;

  const statutInitial = appreciationTerminee
    ? "TERMINE"
    : appreciationEnCours
      ? "APPRECIATION_EN_COURS"
      : autoEvaluationEnCours
        ? "AUTO_EVAL_EN_COURS"
        : "PAS_DEBUTE";
  const [statutCompletionAppreciation, setStatutCompletionAppreciation] =
    useState<
      "PAS_DEBUTE" | "AUTO_EVAL_EN_COURS" | "APPRECIATION_EN_COURS" | "TERMINE"
    >(statutInitial);

  return (
    <pageAppreciation.ServerSidePropsProvider value={props}>
      <main className="py-6 pt-0 !bg-white">
        <Head>
          <title>PILOTE - Appréciation</title>
        </Head>

        <div className="min-h-[60vh] py-12">
          <div className="mx-auto w-full max-w-6xl">
            <header className="mb-6">
              <div className="flex justify-between">
                <h1 className="!text-3xl font-bold mb-2">
                  Bienvenue sur votre espace d'appréciation 2025
                </h1>
                <SelecteurPhaseAppreciation
                  onChange={setStatutCompletionAppreciation}
                  value={statutCompletionAppreciation}
                />
              </div>
              <h2 className="!text-2xl !text-primary">
                L'appréciation par les préfets de région
              </h2>
              <p className="text-gray-600 !mb-0">
                Dans le cadre de l’évaluation des résultats des objectifs
                interministériels des préfets, le Premier Ministre a chargé les
                préfets de région de transmettre leur appréciation des résultats
                des objectifs individuels et de la manière de servir des préfets
                de département.
              </p>
              <InformationEnteteAppreciation
                statutCompletionAppreciation={statutCompletionAppreciation}
              />
            </header>
          </div>
          <ListePhaseEvaluation />
        </div>
      </main>
    </pageAppreciation.ServerSidePropsProvider>
  );
}
