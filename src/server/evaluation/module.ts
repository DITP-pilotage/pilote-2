import { asClass } from "awilix";
import { AfficherAutoEvaluationQuery } from "@/server/evaluation/queries/AfficherAutoEvaluationQuery";
import { ListerFichesAutoEvaluationQuery } from "@/server/evaluation/queries/ListerFichesAutoEvaluationQuery";
import { ListerFichesEvaluationParPhaseQuery } from "@/server/evaluation/queries/ListerFichesEvaluationParPhaseQuery";
import { ListerUtilisateursPiloteEval } from "@/server/evaluation/queries/ListerUtilisateursPiloteEval";
import { ListerCriteresPiloteEval } from "@/server/evaluation/queries/ListerCriteresPiloteEval";
import { ListerRattachementsPiloteEval } from "@/server/evaluation/queries/ListerRattachementsPiloteEval";
import { ListerObjectifsParRattachementPiloteEval } from "@/server/evaluation/queries/ListerObjectifsParRattachementPiloteEval";
import { RecupererDroitsUtilisateurQuery } from "@/server/evaluation/queries/RecupererDroitsUtilisateurQuery";
import { GetRattachementPourEtapeQuery } from "@/server/evaluation/queries/GetRattachementPourEtapeQuery";
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
import { defineModule } from "@/server/module-system";
import { EnregistrerBrouillonAutoEvaluationObjectifsHandler } from "./handlers/EnregistrerBrouillonAutoEvaluationObjectifsHandler";
import { EnregistrerBrouillonAutoEvaluationCriteresHandler } from "./handlers/EnregistrerBrouillonAutoEvaluationCriteresHandler";
import { ValiderSaisieCriteresHandler } from "./handlers/ValiderSaisieCriteresHandler";
import { ValiderSaisieObjectifsHandler } from "./handlers/ValiderSaisieObjectifsHandler";
import { SetTraitementEvaluationHandler } from "./handlers/SetTraitementEvaluationHandler";
import { RetournerAutoEvaluationHandler } from "./handlers/RetournerAutoEvaluationHandler";
import { RetournerAppreciationHandler } from "./handlers/RetournerAppreciationHandler";
import { ModifierObjectifHandler } from "./handlers/ModifierObjectifHandler";
import { GenererPDFEvaluationHandler } from "./handlers/GenererPDFEvaluationHandler";
import { ModifierDroitsUtilisateurHandler } from "./handlers/ModifierDroitsUtilisateurHandler";
import { NotificationEmailService } from "./services/NotificationEmailService";
import { TransmettreAppreciationHandler } from "./handlers/TransmettreAppreciationHandler";

type PiloteEvalExports = Record<string, never>;

type PiloteEvalCradle = PiloteEvalExports & {
  afficherAutoEvaluation: AfficherAutoEvaluationQuery;
  afficherConsolidationQuery: AfficherConsolidationQuery;
  afficherInstructionQuery: AfficherInstructionQuery;
  afficherPilotageQuery: AfficherPilotageQuery;
  listerFichesAutoEvaluation: ListerFichesAutoEvaluationQuery;
  listerFichesEvaluationParPhaseQuery: ListerFichesEvaluationParPhaseQuery;
  listerUtilisateursPiloteEval: ListerUtilisateursPiloteEval;
  listerCriteresPiloteEval: ListerCriteresPiloteEval;
  listerRattachementsPiloteEval: ListerRattachementsPiloteEval;
  listerObjectifsParRattachementPiloteEval: ListerObjectifsParRattachementPiloteEval;
  recupererDroitsUtilisateurQuery: RecupererDroitsUtilisateurQuery;
  recupererDetailsNoteCollectiveQuery: RecupererDetailsNoteCollectiveQuery;
  getRattachementPourEtapeQuery: GetRattachementPourEtapeQuery;
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
  genererPDFEvaluationHandler: GenererPDFEvaluationHandler;
  modifierDroitsUtilisateurHandler: ModifierDroitsUtilisateurHandler;
  notificationEmailService: NotificationEmailService;
  transmettreAppreciationHandler: TransmettreAppreciationHandler;
};

export type PiloteEvalDependencies = PiloteEvalCradle;

export const piloteEvalModule = defineModule<
  "piloteEval",
  PiloteEvalExports,
  PiloteEvalCradle
>({
  name: "piloteEval",
  imports: ["shared"],
  exports: [],
  register: (container) => {
    container.register({
      afficherAutoEvaluation: asClass(AfficherAutoEvaluationQuery),
      afficherConsolidationQuery: asClass(AfficherConsolidationQuery),
      afficherInstructionQuery: asClass(AfficherInstructionQuery),
      afficherPilotageQuery: asClass(AfficherPilotageQuery),
      listerFichesAutoEvaluation: asClass(ListerFichesAutoEvaluationQuery),
      listerFichesEvaluationParPhaseQuery: asClass(
        ListerFichesEvaluationParPhaseQuery,
      ),
      listerUtilisateursPiloteEval: asClass(ListerUtilisateursPiloteEval),
      listerCriteresPiloteEval: asClass(ListerCriteresPiloteEval),
      listerRattachementsPiloteEval: asClass(ListerRattachementsPiloteEval),
      listerObjectifsParRattachementPiloteEval: asClass(
        ListerObjectifsParRattachementPiloteEval,
      ),
      recupererDroitsUtilisateurQuery: asClass(RecupererDroitsUtilisateurQuery),
      recupererDetailsNoteCollectiveQuery: asClass(
        RecupererDetailsNoteCollectiveQuery,
      ),
      getRattachementPourEtapeQuery: asClass(GetRattachementPourEtapeQuery),
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
      genererPDFEvaluationHandler: asClass(GenererPDFEvaluationHandler),
      modifierDroitsUtilisateurHandler: asClass(
        ModifierDroitsUtilisateurHandler,
      ),
      notificationEmailService: asClass(NotificationEmailService),
      transmettreAppreciationHandler: asClass(TransmettreAppreciationHandler),
    });
  },
});
