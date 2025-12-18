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
import { Disclosure } from "@/components/shared/Disclosure";

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
                Dans le cadre de l'évaluation des résultats des objectifs
                interministériels des préfets, le Premier Ministre a chargé les
                préfets de région de transmettre leur appréciation des résultats
                des objectifs individuels et de la manière de servir des préfets
                de département.
              </p>
              <Disclosure trigger="En savoir plus">
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="!mb-0">
                      Ces deux critères sont des composantes des objectifs
                      interministériels des préfets :
                    </p>

                    <ul>
                      <li>
                        <strong>les objectifs individuels</strong> sont des
                        actions concrètes qui répondent à un enjeu majeur et des
                        défis rencontrés dans la mise en œuvre des missions
                        interministérielles des préfets.
                      </li>

                      <li>
                        <strong>la manière de servir</strong> correspond à la
                        mise en œuvre des principales transformations attendues,
                        notamment dans le cadre de la Refondation de l'action
                        publique. Ces transformations correspondent au pilotage
                        des services déconcentrés et opérateurs de l'Etat, à la
                        mise en œuvre du programme de simplification,
                        l'amélioration de la qualité du service public et la
                        qualité de la communication.
                      </li>
                    </ul>
                  </div>

                  <p className="font-bold !text-2xl !text-primary !mb-0">
                    Quel est le contenu des appréciations par les préfets de
                    région ?
                  </p>

                  <div>
                    <p className="!mb-0">
                      Il vous est demandé de réaliser une appréciation pour
                      chacun des objectifs individuels retenus dans les
                      départements de votre région ainsi que pour chaque
                      composante de la manière de servir à partir de votre
                      espace d'appréciation :
                    </p>

                    <ul>
                      <li>
                        <strong>Pour les objectifs individuels :</strong> vous
                        devez saisir des résultats quantitatifs et des
                        commentaires pour chacun des objectifs individuels
                        validés pour les départements de votre région. Les
                        résultats quantitatifs doivent vous être fournis par les
                        préfets de département. Il vous est possible de les
                        ajuster en fonction de votre appréciation personnelle.
                        Une moyenne est ensuite calculée à partir de ces
                        résultats.
                      </li>
                      <li>
                        <strong>Pour la manière de servir :</strong> vous devez
                        saisir des résultats quantitatifs et des commentaires
                        qualitatifs pour chaque axe de transformation retenu
                        dans le cadre de la manière de servir. L'appréciation
                        quantitative prend la forme d'une note attribuée de A+ à
                        E. Une moyenne est ensuite calculée à partir de ces
                        résultats.
                      </li>
                    </ul>

                    <p className="!mb-0">
                      <strong>Pour les objectifs collectifs</strong>, il n'est
                      demandé aucune appréciation aux préfets de région. Les
                      résultats des objectifs collectifs sont directement
                      constatés dans l'outil.
                    </p>
                    <p className="!mb-0">
                      La moyenne des résultats obtenus pour les objectifs
                      individuels et la manière de servir est ensuite intégrée à
                      la moyenne des résultats constatés pour les objectifs
                      collectifs. La moyenne globale participera à fixer le
                      montant du complément indemnitaire annuelle de chaque
                      préfet.
                    </p>
                  </div>
                </div>
              </Disclosure>
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
