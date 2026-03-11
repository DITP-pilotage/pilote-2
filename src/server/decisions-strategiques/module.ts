import { ImportDecisionStrategiqueAPIHandler } from "@/server/decisions-strategiques/infrastructure/handlers/ImportDecisionStrategiqueAPIHandler";
import { ImporterDecisionsStrategiquesUseCase } from "@/server/decisions-strategiques/usecases/ImporterDecisionsStrategiquesUseCase";
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
  décisionStratégiqueRepository: DécisionStratégiqueRepository;
};

export const importDecisionStrategiqueModule = defineModule<
  NoExports,
  ImportDecisionStrategiqueCradle
>()({
  name: "importDecisionStrategique",
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
    });
  },
});

type Scope = ExtractScope<typeof importDecisionStrategiqueModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
