import { asClass, AwilixContainer, createContainer } from "awilix";
import { AfficherAutoEvaluationUseCase } from "@/server/pilote-eval/usecases/AfficherAutoEvaluationUseCase";

export type PiloteEvalDependencies = {
  afficherAutoEvaluation: AfficherAutoEvaluationUseCase;
};

export const getPiloteEvalContainer =
  (): AwilixContainer<PiloteEvalDependencies> => {
    const container = createContainer();
    return container.register({
      afficherAutoEvaluation: asClass(AfficherAutoEvaluationUseCase),
    });
  };
