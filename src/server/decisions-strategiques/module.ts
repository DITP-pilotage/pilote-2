import { asClass } from "awilix";
import { ImportDecisionStrategiqueAPIHandler } from "@/server/decisions-strategiques/infrastructure/handlers/ImportDecisionStrategiqueAPIHandler";
import { ImporterDecisionsStrategiquesUseCase } from "@/server/decisions-strategiques/usecases/ImporterDecisionsStrategiquesUseCase";
import DécisionStratégiqueRepository from "@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface";
import DécisionStratégiqueSQLRepository from "@/server/infrastructure/accès_données/chantier/décisionStratégique/DécisionStratégiqueSQLRepository";
import { defineModule } from "@/server/module-system";

type ImportDecisionStrategiqueExports = Record<string, never>;

type ImportDecisionStrategiqueCradle = ImportDecisionStrategiqueExports & {
  importDecisionStrategiqueAPIHandler: ImportDecisionStrategiqueAPIHandler;
  importerDecisionsStrategiquesUseCase: ImporterDecisionsStrategiquesUseCase;
  décisionStratégiqueRepository: DécisionStratégiqueRepository;
};

export type ImportDecisionStrategiqueDependencies =
  ImportDecisionStrategiqueCradle;

export const importDecisionStrategiqueModule = defineModule<
  "importDecisionStrategique",
  ImportDecisionStrategiqueExports,
  ImportDecisionStrategiqueCradle
>({
  name: "importDecisionStrategique",
  imports: ["shared"],
  exports: [],
  register: (container) => {
    container.register({
      décisionStratégiqueRepository: asClass(DécisionStratégiqueSQLRepository),
      importerDecisionsStrategiquesUseCase: asClass(
        ImporterDecisionsStrategiquesUseCase,
      ),
      importDecisionStrategiqueAPIHandler: asClass(
        ImportDecisionStrategiqueAPIHandler,
      ),
    });
  },
});
