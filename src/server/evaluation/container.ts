import { asClass, AwilixContainer } from "awilix";
import { AfficherAutoEvaluationQuery } from "@/server/evaluation/queries/AfficherAutoEvaluationQuery";
import { ListerFichesAutoEvaluationQuery } from "@/server/evaluation/queries/ListerFichesAutoEvaluationQuery";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { AccesFicheEvaluationService } from "@/server/evaluation/services/AccesFicheEvaluationService";
import { SoumettreAutoEvaluationHandler } from "@/server/evaluation/handlers/SoumettreAutoEvaluationHandler";
import { AfficherConsolidationQuery } from "@/server/evaluation/queries/AfficherConsolidationQuery";
import { EnregistrerBrouillonAutoEvaluationHandler } from "./handlers/EnregistrerBrouillonAutoEvaluationHandler";

export type PiloteEvalDependencies = {
  afficherAutoEvaluation: AfficherAutoEvaluationQuery;
  afficherConsolidationQuery: AfficherConsolidationQuery;
  listerFichesAutoEvaluation: ListerFichesAutoEvaluationQuery;
  enregistrerBrouillonAutoEvaluation: EnregistrerBrouillonAutoEvaluationHandler;
  accesFicheEvaluationService: AccesFicheEvaluationService;
  soumettreAutoEvaluationHandler: SoumettreAutoEvaluationHandler;
};

export const getPiloteEvalContainer = (
  initialContainer: AwilixContainer<{ prisma: PrismaPilote }>,
): AwilixContainer<PiloteEvalDependencies> => {
  return initialContainer.createScope<PiloteEvalDependencies>().register({
    afficherAutoEvaluation: asClass(AfficherAutoEvaluationQuery),
    afficherConsolidationQuery: asClass(AfficherConsolidationQuery),
    listerFichesAutoEvaluation: asClass(ListerFichesAutoEvaluationQuery),
    enregistrerBrouillonAutoEvaluation: asClass(
      EnregistrerBrouillonAutoEvaluationHandler,
    ),
    accesFicheEvaluationService: asClass(AccesFicheEvaluationService),
    soumettreAutoEvaluationHandler: asClass(SoumettreAutoEvaluationHandler),
  });
};
