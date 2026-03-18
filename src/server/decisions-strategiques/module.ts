import { ImportDecisionStrategiqueAPIHandler } from "@/server/decisions-strategiques/infrastructure/handlers/ImportDecisionStrategiqueAPIHandler";
import { ImporterDecisionsStrategiquesUseCase } from "@/server/decisions-strategiques/usecases/ImporterDecisionsStrategiquesUseCase";
import { PublierDecisionStrategiqueUseCase } from "@/server/decisions-strategiques/usecases/PublierDecisionStrategiqueUseCase";
import { EnregistrerBrouillonDecisionStrategiqueUseCase } from "@/server/decisions-strategiques/usecases/EnregistrerBrouillonDecisionStrategiqueUseCase";
import { PublierBrouillonDecisionStrategiqueUseCase } from "@/server/decisions-strategiques/usecases/PublierBrouillonDecisionStrategiqueUseCase";
import { ModifierDecisionStrategiquePublieeUseCase } from "@/server/decisions-strategiques/usecases/ModifierDecisionStrategiquePublieeUseCase";
import { ModifierBrouillonDecisionStrategiqueUseCase } from "@/server/decisions-strategiques/usecases/ModifierBrouillonDecisionStrategiqueUseCase";
import { RecupererDerniereDecisionStrategiqueQuery } from "@/server/decisions-strategiques/queries/RecupererDerniereDecisionStrategiqueQuery";
import { RecupererBrouillonDecisionStrategiqueQuery } from "@/server/decisions-strategiques/queries/RecupererBrouillonDecisionStrategiqueQuery";
import { RecupererHistoriqueDecisionStrategiqueQuery } from "@/server/decisions-strategiques/queries/RecupererHistoriqueDecisionStrategiqueQuery";
import DécisionStratégiqueRepository from "@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface";
import DécisionStratégiqueSQLRepository from "@/server/infrastructure/accès_données/chantier/décisionStratégique/DécisionStratégiqueSQLRepository";
import {
  defineModule,
  type ExtractScope,
  type NoExports,
} from "@/server/module-system";

type ImportDecisionStrategiqueCradle = {
  importDecisionStrategiqueAPIHandler: ImportDecisionStrategiqueAPIHandler;
  importerDecisionsStrategiquesUseCase: ImporterDecisionsStrategiquesUseCase;
  publierDecisionStrategiqueUseCase: PublierDecisionStrategiqueUseCase;
  enregistrerBrouillonDecisionStrategiqueUseCase: EnregistrerBrouillonDecisionStrategiqueUseCase;
  publierBrouillonDecisionStrategiqueUseCase: PublierBrouillonDecisionStrategiqueUseCase;
  modifierDecisionStrategiquePublieeUseCase: ModifierDecisionStrategiquePublieeUseCase;
  modifierBrouillonDecisionStrategiqueUseCase: ModifierBrouillonDecisionStrategiqueUseCase;
  recupererDerniereDecisionStrategiqueQuery: RecupererDerniereDecisionStrategiqueQuery;
  recupererBrouillonDecisionStrategiqueQuery: RecupererBrouillonDecisionStrategiqueQuery;
  recupererHistoriqueDecisionStrategiqueQuery: RecupererHistoriqueDecisionStrategiqueQuery;
  décisionStratégiqueRepository: DécisionStratégiqueRepository;
};

export const importDecisionStrategiqueModule = defineModule<
  NoExports,
  ImportDecisionStrategiqueCradle
>()({
  name: "decisionStrategique",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      décisionStratégiqueRepository: asModuleClass(
        DécisionStratégiqueSQLRepository,
      ),
      importerDecisionsStrategiquesUseCase: asModuleClass(
        ImporterDecisionsStrategiquesUseCase,
      ),
      importDecisionStrategiqueAPIHandler: asModuleClass(
        ImportDecisionStrategiqueAPIHandler,
      ),
      publierDecisionStrategiqueUseCase: asModuleClass(
        PublierDecisionStrategiqueUseCase,
      ),
      enregistrerBrouillonDecisionStrategiqueUseCase: asModuleClass(
        EnregistrerBrouillonDecisionStrategiqueUseCase,
      ),
      publierBrouillonDecisionStrategiqueUseCase: asModuleClass(
        PublierBrouillonDecisionStrategiqueUseCase,
      ),
      modifierDecisionStrategiquePublieeUseCase: asModuleClass(
        ModifierDecisionStrategiquePublieeUseCase,
      ),
      modifierBrouillonDecisionStrategiqueUseCase: asModuleClass(
        ModifierBrouillonDecisionStrategiqueUseCase,
      ),
      recupererDerniereDecisionStrategiqueQuery: asModuleClass(
        RecupererDerniereDecisionStrategiqueQuery,
      ),
      recupererBrouillonDecisionStrategiqueQuery: asModuleClass(
        RecupererBrouillonDecisionStrategiqueQuery,
      ),
      recupererHistoriqueDecisionStrategiqueQuery: asModuleClass(
        RecupererHistoriqueDecisionStrategiqueQuery,
      ),
    });
  },
});

type Scope = ExtractScope<typeof importDecisionStrategiqueModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
