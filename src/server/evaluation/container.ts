import { asClass, AwilixContainer } from "awilix";
import { AfficherAutoEvaluationUseCase } from "@/server/evaluation/usecases/AfficherAutoEvaluationUseCase";
import { ListerRattachementsUseCase } from "@/server/evaluation/usecases/ListerRattachementsUseCase";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type PiloteEvalDependencies = {
  afficherAutoEvaluation: AfficherAutoEvaluationUseCase;
  listerRattachements: ListerRattachementsUseCase;
};

export const getPiloteEvalContainer = (
  initialContainer: AwilixContainer<{ prisma: PrismaPilote }>,
): AwilixContainer<PiloteEvalDependencies> => {
  return initialContainer.createScope<PiloteEvalDependencies>().register({
    afficherAutoEvaluation: asClass(AfficherAutoEvaluationUseCase),
    listerRattachements: asClass(ListerRattachementsUseCase),
  });
};
