import { asClass, AwilixContainer } from "awilix";
import { AfficherAutoEvaluationQuery } from "@/server/evaluation/queries/AfficherAutoEvaluationQuery";
import { ListerFichesAutoEvaluationQuery } from "@/server/evaluation/queries/ListerFichesAutoEvaluationQuery";
import { ListerFichesEvaluationParPhaseQuery } from "@/server/evaluation/queries/ListerFichesEvaluationParPhaseQuery";
import { ListerUtilisateursPiloteEval } from "@/server/evaluation/queries/ListerUtilisateursPiloteEval";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { AccesFicheEvaluationService } from "@/server/evaluation/services/AccesFicheEvaluationService";
import { AfficherConsolidationQuery } from "@/server/evaluation/queries/AfficherConsolidationQuery";
import { EnregistrerBrouillonConsolidationHandler } from "@/server/evaluation/handlers/EnregistrerBrouillonConsolidationHandler";
import { AfficherPilotageQuery } from "@/server/evaluation/queries/AfficherPilotageQuery";
import { ModifierEtatFichesConsolidationHandler } from "@/server/evaluation/handlers/ModifierEtatFichesConsolidationHandler";
import { PasserALEtapeInstructionHandler } from "@/server/evaluation/handlers/PasserALEtapeInstructionHandler";
import { AfficherInstructionQuery } from "@/server/evaluation/queries/AfficherInstructionQuery";
import { EnregistrerBrouillonInstructionHandler } from "@/server/evaluation/handlers/EnregistrerBrouillonInstructionHandler";
import { ModifierEtatFichesInstructionHandler } from "@/server/evaluation/handlers/ModifierEtatFichesInstructionHandler";
import { RecupererDetailsNoteCollectiveQuery } from "@/server/evaluation/queries/RecupererDetailsNoteCollectiveQuery";
import { SoumettreEtapeEvaluationService } from "@/server/evaluation/services/SoumettreEtapeEvaluationService";
import { PasserALaConsolidationHandler } from "@/server/evaluation/handlers/PasserALaConsolidationHandler";
import { EnregistrerBrouillonAutoEvaluationObjectifsHandler } from "./handlers/EnregistrerBrouillonAutoEvaluationObjectifsHandler";
import { EnregistrerBrouillonAutoEvaluationCriteresHandler } from "./handlers/EnregistrerBrouillonAutoEvaluationCriteresHandler";
import { ValiderSaisieCriteresHandler } from "./handlers/ValiderSaisieCriteresHandler";
import { ValiderSaisieObjectifsHandler } from "./handlers/ValiderSaisieObjectifsHandler";
import { SetTraitementEvaluationHandler } from "./handlers/SetTraitementEvaluationHandler";
import { RetournerAutoEvaluationHandler } from "./handlers/RetournerAutoEvaluationHandler";
import { RetournerAppreciationHandler } from "./handlers/RetournerAppreciationHandler";
import { ModifierObjectifHandler } from "./handlers/ModifierObjectifHandler";
import { GenererPDFAutoEvaluationHandler } from "./handlers/GenererPDFAutoEvaluationHandler";

export type PiloteEvalDependencies = {
  afficherAutoEvaluation: AfficherAutoEvaluationQuery;
  afficherConsolidationQuery: AfficherConsolidationQuery;
  afficherInstructionQuery: AfficherInstructionQuery;
  afficherPilotageQuery: AfficherPilotageQuery;
  listerFichesAutoEvaluation: ListerFichesAutoEvaluationQuery;
  listerFichesEvaluationParPhaseQuery: ListerFichesEvaluationParPhaseQuery;
  listerUtilisateursPiloteEval: ListerUtilisateursPiloteEval;
  recupererDetailsNoteCollectiveQuery: RecupererDetailsNoteCollectiveQuery;
  enregistrerBrouillonAutoEvaluationObjectifs: EnregistrerBrouillonAutoEvaluationObjectifsHandler;
  enregistrerBrouillonAutoEvaluationCriteres: EnregistrerBrouillonAutoEvaluationCriteresHandler;
  validerSaisieObjectifs: ValiderSaisieObjectifsHandler;
  validerSaisieCriteres: ValiderSaisieCriteresHandler;
  enregistrerBrouillonConsolidationHandler: EnregistrerBrouillonConsolidationHandler;
  enregistrerBrouillonInstructionHandler: EnregistrerBrouillonInstructionHandler;
  accesFicheEvaluationService: AccesFicheEvaluationService;
  soumettreEtapeEvaluationService: SoumettreEtapeEvaluationService;
  modifierEtatFichesConsolidationHandler: ModifierEtatFichesConsolidationHandler;
  modifierEtatFichesInstructionHandler: ModifierEtatFichesInstructionHandler;
  passerALaConsolidationHandler: PasserALaConsolidationHandler;
  passerALEtapeInstructionHandler: PasserALEtapeInstructionHandler;
  setTraitementEvaluationHandler: SetTraitementEvaluationHandler;
  retournerAutoEvaluationHandler: RetournerAutoEvaluationHandler;
  retournerAppreciationHandler: RetournerAppreciationHandler;
  modifierObjectifHandler: ModifierObjectifHandler;
  genererPDFAutoEvaluationHandler: GenererPDFAutoEvaluationHandler;
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
    listerFichesEvaluationParPhaseQuery: asClass(
      ListerFichesEvaluationParPhaseQuery,
    ),
    listerUtilisateursPiloteEval: asClass(ListerUtilisateursPiloteEval),
    recupererDetailsNoteCollectiveQuery: asClass(
      RecupererDetailsNoteCollectiveQuery,
    ),
    enregistrerBrouillonAutoEvaluationObjectifs: asClass(
      EnregistrerBrouillonAutoEvaluationObjectifsHandler,
    ),
    enregistrerBrouillonAutoEvaluationCriteres: asClass(
      EnregistrerBrouillonAutoEvaluationCriteresHandler,
    ),
    validerSaisieObjectifs: asClass(ValiderSaisieObjectifsHandler),
    validerSaisieCriteres: asClass(ValiderSaisieCriteresHandler),
    enregistrerBrouillonConsolidationHandler: asClass(
      EnregistrerBrouillonConsolidationHandler,
    ),
    enregistrerBrouillonInstructionHandler: asClass(
      EnregistrerBrouillonInstructionHandler,
    ),
    accesFicheEvaluationService: asClass(AccesFicheEvaluationService),
    soumettreEtapeEvaluationService: asClass(SoumettreEtapeEvaluationService),
    modifierEtatFichesConsolidationHandler: asClass(
      ModifierEtatFichesConsolidationHandler,
    ),
    modifierEtatFichesInstructionHandler: asClass(
      ModifierEtatFichesInstructionHandler,
    ),
    passerALaConsolidationHandler: asClass(PasserALaConsolidationHandler),
    passerALEtapeInstructionHandler: asClass(PasserALEtapeInstructionHandler),
    setTraitementEvaluationHandler: asClass(SetTraitementEvaluationHandler),
    retournerAutoEvaluationHandler: asClass(RetournerAutoEvaluationHandler),
    retournerAppreciationHandler: asClass(RetournerAppreciationHandler),
    modifierObjectifHandler: asClass(ModifierObjectifHandler),
    genererPDFAutoEvaluationHandler: asClass(GenererPDFAutoEvaluationHandler),
  });
};
