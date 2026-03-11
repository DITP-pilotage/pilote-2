import { ImportObjectifAPIHandler } from "@/server/objectifs/infrastructure/handlers/ImportObjectifAPIHandler";
import { ImporterObjectifsUseCase } from "@/server/objectifs/usecases/ImporterObjectifsUseCase";
import ObjectifRepository from "@/server/domain/chantier/objectif/ObjectifRepository.interface";
import ObjectifSQLRepository from "@/server/infrastructure/accès_données/chantier/objectif/ObjectifSQLRepository";
import {
  defineModule,
  type ModuleScope,
  type NoExports,
} from "@/server/module-system";

type ImportObjectifCradle = NoExports & {
  importObjectifAPIHandler: ImportObjectifAPIHandler;
  importerObjectifsUseCase: ImporterObjectifsUseCase;
  objectifRepository: ObjectifRepository;
};

export const importObjectifModule = defineModule<
  NoExports,
  ImportObjectifCradle
>()({
  name: "importObjectif",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      objectifRepository: asModuleClass(ObjectifSQLRepository),
      importerObjectifsUseCase: asModuleClass(ImporterObjectifsUseCase),
      importObjectifAPIHandler: asModuleClass(ImportObjectifAPIHandler),
    });
  },
});

type Scope = ModuleScope<ImportObjectifCradle>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
