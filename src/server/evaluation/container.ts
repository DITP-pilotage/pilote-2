import { asClass, AwilixContainer } from "awilix";
import { AfficherAutoEvaluationQuery } from "@/server/evaluation/queries/AfficherAutoEvaluationQuery";
import { ListerRattachementsUseCase } from "@/server/evaluation/usecases/ListerRattachementsUseCase";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { EnregistrerBrouillonAutoEvaluationHandler } from "./handlers/EnregistrerBrouillonAutoEvaluationHandler";

export type PiloteEvalDependencies = {
  afficherAutoEvaluation: AfficherAutoEvaluationQuery;
  listerRattachements: ListerRattachementsUseCase;
  enregistrerBrouillonAutoEvaluation: EnregistrerBrouillonAutoEvaluationHandler;
};

export const getPiloteEvalContainer = (
  initialContainer: AwilixContainer<{ prisma: PrismaPilote }>,
): AwilixContainer<PiloteEvalDependencies> => {
  return initialContainer.createScope<PiloteEvalDependencies>().register({
    afficherAutoEvaluation: asClass(AfficherAutoEvaluationQuery),
    listerRattachements: asClass(ListerRattachementsUseCase),
    enregistrerBrouillonAutoEvaluation: asClass(
      EnregistrerBrouillonAutoEvaluationHandler,
    ),
  });
};
