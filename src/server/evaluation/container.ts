import { asClass, AwilixContainer, createContainer } from "awilix";
import { AfficherAutoEvaluationUseCase } from "@/server/evaluation/usecases/AfficherAutoEvaluationUseCase";
import { ListerRattachementsUseCase } from "@/server/evaluation/usecases/ListerRattachementsUseCase";

export type PiloteEvalDependencies = {
  afficherAutoEvaluation: AfficherAutoEvaluationUseCase;
  listerRattachements: ListerRattachementsUseCase;
};

export const getPiloteEvalContainer =
  (): AwilixContainer<PiloteEvalDependencies> => {
    const container = createContainer();
    return container.register({
      afficherAutoEvaluation: asClass(AfficherAutoEvaluationUseCase),
      listerRattachements: asClass(ListerRattachementsUseCase),
    });
  };
