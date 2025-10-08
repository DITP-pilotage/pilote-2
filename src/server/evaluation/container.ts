import { asClass, AwilixContainer } from "awilix";
import { AfficherAutoEvaluationQuery } from "@/server/evaluation/queries/AfficherAutoEvaluationQuery";
import { ListerFichesAutoEvaluationQuery } from "@/server/evaluation/queries/ListerFichesAutoEvaluationQuery";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { EnregistrerBrouillonAutoEvaluationHandler } from "./handlers/EnregistrerBrouillonAutoEvaluationHandler";

export type PiloteEvalDependencies = {
  afficherAutoEvaluation: AfficherAutoEvaluationQuery;
  listerFichesAutoEvaluation: ListerFichesAutoEvaluationQuery;
  enregistrerBrouillonAutoEvaluation: EnregistrerBrouillonAutoEvaluationHandler;
};

export const getPiloteEvalContainer = (
  initialContainer: AwilixContainer<{ prisma: PrismaPilote }>,
): AwilixContainer<PiloteEvalDependencies> => {
  return initialContainer.createScope<PiloteEvalDependencies>().register({
    afficherAutoEvaluation: asClass(AfficherAutoEvaluationQuery),
    listerFichesAutoEvaluation: asClass(ListerFichesAutoEvaluationQuery),
    enregistrerBrouillonAutoEvaluation: asClass(
      EnregistrerBrouillonAutoEvaluationHandler,
    ),
  });
};
