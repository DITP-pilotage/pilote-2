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
import {
  defineModule,
  type ExtractScope,
  type NoExports,
} from "@/server/module-system";
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

type PiloteEvalCradle = {
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

export const piloteEvalModule = defineModule<NoExports, PiloteEvalCradle>()({
  name: "piloteEval",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      afficherAutoEvaluation: asModuleClass(AfficherAutoEvaluationQuery),
      afficherConsolidationQuery: asModuleClass(AfficherConsolidationQuery),
      afficherInstructionQuery: asModuleClass(AfficherInstructionQuery),
      afficherPilotageQuery: asModuleClass(AfficherPilotageQuery),
      listerFichesAutoEvaluation: asModuleClass(
        ListerFichesAutoEvaluationQuery,
      ),
      listerFichesEvaluationParPhaseQuery: asModuleClass(
        ListerFichesEvaluationParPhaseQuery,
      ),
      listerUtilisateursPiloteEval: asModuleClass(ListerUtilisateursPiloteEval),
      listerCriteresPiloteEval: asModuleClass(ListerCriteresPiloteEval),
      listerRattachementsPiloteEval: asModuleClass(
        ListerRattachementsPiloteEval,
      ),
      listerObjectifsParRattachementPiloteEval: asModuleClass(
        ListerObjectifsParRattachementPiloteEval,
      ),
      recupererDroitsUtilisateurQuery: asModuleClass(
        RecupererDroitsUtilisateurQuery,
      ),
      recupererDetailsNoteCollectiveQuery: asModuleClass(
        RecupererDetailsNoteCollectiveQuery,
      ),
      getRattachementPourEtapeQuery: asModuleClass(
        GetRattachementPourEtapeQuery,
      ),
      enregistrerBrouillonAutoEvaluationObjectifs: asModuleClass(
        EnregistrerBrouillonAutoEvaluationObjectifsHandler,
      ),
      enregistrerBrouillonAutoEvaluationCriteres: asModuleClass(
        EnregistrerBrouillonAutoEvaluationCriteresHandler,
      ),
      validerSaisieObjectifs: asModuleClass(ValiderSaisieObjectifsHandler),
      validerSaisieCriteres: asModuleClass(ValiderSaisieCriteresHandler),
      enregistrerBrouillonConsolidationHandler: asModuleClass(
        EnregistrerBrouillonConsolidationHandler,
      ),
      enregistrerBrouillonInstructionHandler: asModuleClass(
        EnregistrerBrouillonInstructionHandler,
      ),
      accesFicheEvaluationService: asModuleClass(AccesFicheEvaluationService),
      soumettreEtapeEvaluationService: asModuleClass(
        SoumettreEtapeEvaluationService,
      ),
      modifierEtatFichesConsolidationHandler: asModuleClass(
        ModifierEtatFichesConsolidationHandler,
      ),
      modifierEtatFichesInstructionHandler: asModuleClass(
        ModifierEtatFichesInstructionHandler,
      ),
      passerALaConsolidationHandler: asModuleClass(
        PasserALaConsolidationHandler,
      ),
      passerALEtapeInstructionHandler: asModuleClass(
        PasserALEtapeInstructionHandler,
      ),
      setTraitementEvaluationHandler: asModuleClass(
        SetTraitementEvaluationHandler,
      ),
      retournerAutoEvaluationHandler: asModuleClass(
        RetournerAutoEvaluationHandler,
      ),
      retournerAppreciationHandler: asModuleClass(RetournerAppreciationHandler),
      modifierObjectifHandler: asModuleClass(ModifierObjectifHandler),
      genererPDFEvaluationHandler: asModuleClass(GenererPDFEvaluationHandler),
      modifierDroitsUtilisateurHandler: asModuleClass(
        ModifierDroitsUtilisateurHandler,
      ),
      notificationEmailService: asModuleClass(NotificationEmailService),
      transmettreAppreciationHandler: asModuleClass(
        TransmettreAppreciationHandler,
      ),
    } satisfies Record<keyof PiloteEvalCradle, unknown>);
  },
});

type Scope = ExtractScope<typeof piloteEvalModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
