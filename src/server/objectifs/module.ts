import { asClass } from "awilix";
import { ImportObjectifAPIHandler } from "@/server/objectifs/infrastructure/handlers/ImportObjectifAPIHandler";
import { ImporterObjectifsUseCase } from "@/server/objectifs/usecases/ImporterObjectifsUseCase";
import ObjectifRepository from "@/server/domain/chantier/objectif/ObjectifRepository.interface";
import ObjectifSQLRepository from "@/server/infrastructure/accès_données/chantier/objectif/ObjectifSQLRepository";
import { defineModule } from "@/server/module-system";

type ImportObjectifExports = Record<string, never>;

type ImportObjectifCradle = ImportObjectifExports & {
  importObjectifAPIHandler: ImportObjectifAPIHandler;
  importerObjectifsUseCase: ImporterObjectifsUseCase;
  objectifRepository: ObjectifRepository;
};

export type ImportObjectifDependencies = ImportObjectifCradle;

export const importObjectifModule = defineModule<
  ImportObjectifExports,
  ImportObjectifCradle
>()({
  name: "importObjectif",
  imports: ["shared"],
  exports: [],
  register: (container) => {
    container.register({
      objectifRepository: asClass(ObjectifSQLRepository),
      importerObjectifsUseCase: asClass(ImporterObjectifsUseCase),
      importObjectifAPIHandler: asClass(ImportObjectifAPIHandler),
    });
  },
});
