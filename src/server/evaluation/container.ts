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
import { EnregistrerBrouillonInstructionHandler } from "@/server/evaluation/handlers/EnregistrerBrouillonInstructionHandler";
import { ModifierEtatFichesInstructionHandler } from "@/server/evaluation/handlers/ModifierEtatFichesInstructionHandler";
import { RecupererDetailsNoteCollectiveQuery } from "@/server/evaluation/queries/RecupererDetailsNoteCollectiveQuery";
import { EnregistrerBrouillonAutoEvaluationObjectifsHandler } from "./handlers/EnregistrerBrouillonAutoEvaluationObjectifsHandler";
import { EnregistrerBrouillonAutoEvaluationCriteresHandler } from "./handlers/EnregistrerBrouillonAutoEvaluationCriteresHandler";

export type PiloteEvalDependencies = {
  afficherAutoEvaluation: AfficherAutoEvaluationQuery;
  afficherConsolidationQuery: AfficherConsolidationQuery;
  afficherInstructionQuery: AfficherInstructionQuery;
  afficherPilotageQuery: AfficherPilotageQuery;
  listerFichesAutoEvaluation: ListerFichesAutoEvaluationQuery;
  recupererDetailsNoteCollectiveQuery: RecupererDetailsNoteCollectiveQuery;
  enregistrerBrouillonAutoEvaluationObjectifs: EnregistrerBrouillonAutoEvaluationObjectifsHandler;
  enregistrerBrouillonAutoEvaluationCriteres: EnregistrerBrouillonAutoEvaluationCriteresHandler;
  enregistrerBrouillonConsolidationHandler: EnregistrerBrouillonConsolidationHandler;
  enregistrerBrouillonInstructionHandler: EnregistrerBrouillonInstructionHandler;
  accesFicheEvaluationService: AccesFicheEvaluationService;
  soumettreAutoEvaluationHandler: SoumettreAutoEvaluationHandler;
  debloquerFichesConsolidationHandler: DebloquerFichesConsolidationHandler;
  modifierEtatFichesInstructionHandler: ModifierEtatFichesInstructionHandler;
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
    recupererDetailsNoteCollectiveQuery: asClass(
      RecupererDetailsNoteCollectiveQuery,
    ),
    enregistrerBrouillonAutoEvaluationObjectifs: asClass(
      EnregistrerBrouillonAutoEvaluationObjectifsHandler,
    ),
    enregistrerBrouillonAutoEvaluationCriteres: asClass(
      EnregistrerBrouillonAutoEvaluationCriteresHandler,
    ),
    enregistrerBrouillonConsolidationHandler: asClass(
      EnregistrerBrouillonConsolidationHandler,
    ),
    enregistrerBrouillonInstructionHandler: asClass(
      EnregistrerBrouillonInstructionHandler,
    ),
    accesFicheEvaluationService: asClass(AccesFicheEvaluationService),
    soumettreAutoEvaluationHandler: asClass(SoumettreAutoEvaluationHandler),
    debloquerFichesConsolidationHandler: asClass(
      DebloquerFichesConsolidationHandler,
    ),
    modifierEtatFichesInstructionHandler: asClass(
      ModifierEtatFichesInstructionHandler,
    ),
    passerALEtapeInstructionHandler: asClass(PasserALEtapeInstructionHandler),
  });
};
