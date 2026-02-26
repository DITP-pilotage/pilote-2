import { asClass, AwilixContainer } from "awilix";
import { ImportDecisionStrategiqueAPIHandler } from "@/server/decisions-strategiques/infrastructure/handlers/ImportDecisionStrategiqueAPIHandler";
import { ImporterDecisionsStrategiquesUseCase } from "@/server/decisions-strategiques/usecases/ImporterDecisionsStrategiquesUseCase";
import DécisionStratégiqueRepository from "@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface";
import DécisionStratégiqueSQLRepository from "@/server/infrastructure/accès_données/chantier/décisionStratégique/DécisionStratégiqueSQLRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type ImportDecisionStrategiqueDependencies = {
  importDecisionStrategiqueAPIHandler: ImportDecisionStrategiqueAPIHandler;
  importerDecisionsStrategiquesUseCase: ImporterDecisionsStrategiquesUseCase;
  décisionStratégiqueRepository: DécisionStratégiqueRepository;
};

export const getImportDecisionStrategiqueContainer = (
  initialContainer: AwilixContainer<{ prisma: PrismaPilote }>,
): AwilixContainer<
  ImportDecisionStrategiqueDependencies & { prisma: PrismaPilote }
> => {
  return initialContainer
    .createScope<ImportDecisionStrategiqueDependencies>()
    .register({
      décisionStratégiqueRepository: asClass(DécisionStratégiqueSQLRepository),
      importerDecisionsStrategiquesUseCase: asClass(
        ImporterDecisionsStrategiquesUseCase,
      ),
      importDecisionStrategiqueAPIHandler: asClass(
        ImportDecisionStrategiqueAPIHandler,
      ),
    });
};
