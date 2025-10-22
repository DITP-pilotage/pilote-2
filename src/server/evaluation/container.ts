import { asClass, AwilixContainer } from "awilix";
import { AfficherAutoEvaluationQuery } from "@/server/evaluation/queries/AfficherAutoEvaluationQuery";
import { ListerFichesAutoEvaluationQuery } from "@/server/evaluation/queries/ListerFichesAutoEvaluationQuery";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { AccesFicheEvaluationService } from "@/server/evaluation/services/AccesFicheEvaluationService";
import { SoumettreAutoEvaluationHandler } from "@/server/evaluation/handlers/SoumettreAutoEvaluationHandler";
import { AfficherConsolidationQuery } from "@/server/evaluation/queries/AfficherConsolidationQuery";
import { EnregistrerBrouillonConsolidationHandler } from "@/server/evaluation/handlers/EnregistrerBrouillonConsolidationHandler";
import { AfficherPilotageQuery } from "@/server/evaluation/queries/AfficherPilotageQuery";
import { DebloquerFichesConsolidationHandler } from "@/server/evaluation/handlers/DebloquerFichesConsolidationHandler";
import { PasserALEtapeInstructionHandler } from "@/server/evaluation/handlers/PasserALEtapeInstructionHandler";
import { AfficherInstructionQuery } from "@/server/evaluation/queries/AfficherInstructionQuery";
import { EnregistrerBrouillonAutoEvaluationHandler } from "./handlers/EnregistrerBrouillonAutoEvaluationHandler";

export type PiloteEvalDependencies = {
  afficherAutoEvaluation: AfficherAutoEvaluationQuery;
  afficherConsolidationQuery: AfficherConsolidationQuery;
  afficherInstructionQuery: AfficherInstructionQuery;
  afficherPilotageQuery: AfficherPilotageQuery;
  listerFichesAutoEvaluation: ListerFichesAutoEvaluationQuery;
  enregistrerBrouillonAutoEvaluation: EnregistrerBrouillonAutoEvaluationHandler;
  enregistrerBrouillonConsolidationHandler: EnregistrerBrouillonConsolidationHandler;
  accesFicheEvaluationService: AccesFicheEvaluationService;
  soumettreAutoEvaluationHandler: SoumettreAutoEvaluationHandler;
  debloquerFichesConsolidationHandler: DebloquerFichesConsolidationHandler;
  passerALEtapeInstructionHandler: PasserALEtapeInstructionHandler;
};

export const getPiloteEvalContainer = (
  initialContainer: AwilixContainer<{ prisma: PrismaPilote }>,
): AwilixContainer<PiloteEvalDependencies> => {
  return initialContainer.createScope<PiloteEvalDependencies>().register({
    afficherAutoEvaluation: asClass(AfficherAutoEvaluationQuery),
    afficherConsolidationQuery: asClass(AfficherConsolidationQuery),
    afficherInstructionQuery: asClass(AfficherInstructionQuery),
    afficherPilotageQuery: asClass(AfficherPilotageQuery),
    listerFichesAutoEvaluation: asClass(ListerFichesAutoEvaluationQuery),
    enregistrerBrouillonAutoEvaluation: asClass(
      EnregistrerBrouillonAutoEvaluationHandler,
    ),
    enregistrerBrouillonConsolidationHandler: asClass(
      EnregistrerBrouillonConsolidationHandler,
    ),
    accesFicheEvaluationService: asClass(AccesFicheEvaluationService),
    soumettreAutoEvaluationHandler: asClass(SoumettreAutoEvaluationHandler),
    debloquerFichesConsolidationHandler: asClass(
      DebloquerFichesConsolidationHandler,
    ),
    passerALEtapeInstructionHandler: asClass(PasserALEtapeInstructionHandler),
  });
};
