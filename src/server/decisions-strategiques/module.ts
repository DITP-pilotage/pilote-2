import { asClass } from "awilix";
import { ImportDecisionStrategiqueAPIHandler } from "@/server/decisions-strategiques/infrastructure/handlers/ImportDecisionStrategiqueAPIHandler";
import { ImporterDecisionsStrategiquesUseCase } from "@/server/decisions-strategiques/usecases/ImporterDecisionsStrategiquesUseCase";
import DécisionStratégiqueRepository from "@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface";
import DécisionStratégiqueSQLRepository from "@/server/infrastructure/accès_données/chantier/décisionStratégique/DécisionStratégiqueSQLRepository";
import { defineModule, type NoExports } from "@/server/module-system";

type ImportDecisionStrategiqueCradle = NoExports & {
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
