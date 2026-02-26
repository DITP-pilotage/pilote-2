import { asClass, AwilixContainer } from "awilix";
import { ImportObjectifAPIHandler } from "@/server/objectifs/infrastructure/handlers/ImportObjectifAPIHandler";
import { ImporterObjectifsUseCase } from "@/server/objectifs/usecases/ImporterObjectifsUseCase";
import ObjectifRepository from "@/server/domain/chantier/objectif/ObjectifRepository.interface";
import ObjectifSQLRepository from "@/server/infrastructure/accès_données/chantier/objectif/ObjectifSQLRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type ImportObjectifDependencies = {
  importObjectifAPIHandler: ImportObjectifAPIHandler;
  importerObjectifsUseCase: ImporterObjectifsUseCase;
  objectifRepository: ObjectifRepository;
};

export const getImportObjectifContainer = (
  initialContainer: AwilixContainer<{ prisma: PrismaPilote }>,
): AwilixContainer<ImportObjectifDependencies & { prisma: PrismaPilote }> => {
  return initialContainer.createScope<ImportObjectifDependencies>().register({
    objectifRepository: asClass(ObjectifSQLRepository),
    importerObjectifsUseCase: asClass(ImporterObjectifsUseCase),
    importObjectifAPIHandler: asClass(ImportObjectifAPIHandler),
  });
};
