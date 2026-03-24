import { ImportObjectifAPIHandler } from "@/server/objectifs/infrastructure/handlers/ImportObjectifAPIHandler";
import { ImporterObjectifsUseCase } from "@/server/objectifs/usecases/ImporterObjectifsUseCase";
import { PublierObjectifUseCase } from "@/server/objectifs/usecases/PublierObjectifUseCase";
import { EnregistrerBrouillonObjectifUseCase } from "@/server/objectifs/usecases/EnregistrerBrouillonObjectifUseCase";
import { PublierBrouillonObjectifUseCase } from "@/server/objectifs/usecases/PublierBrouillonObjectifUseCase";
import { ModifierBrouillonObjectifUseCase } from "@/server/objectifs/usecases/ModifierBrouillonObjectifUseCase";
import { ModifierObjectifPublieUseCase } from "@/server/objectifs/usecases/ModifierObjectifPublieUseCase";
import { RecupererDerniersObjectifsQuery } from "@/server/objectifs/queries/RecupererDerniersObjectifsQuery";
import { RecupererBrouillonObjectifQuery } from "@/server/objectifs/queries/RecupererBrouillonObjectifQuery";
import { RecupererHistoriqueObjectifQuery } from "@/server/objectifs/queries/RecupererHistoriqueObjectifQuery";
import ObjectifRepository from "@/server/domain/chantier/objectif/ObjectifRepository.interface";
import ObjectifSQLRepository from "@/server/infrastructure/accès_données/chantier/objectif/ObjectifSQLRepository";
import {
  defineModule,
  type ExtractScope,
  type NoExports,
} from "@/server/module-system";

type ObjectifCradle = {
  importObjectifAPIHandler: ImportObjectifAPIHandler;
  importerObjectifsUseCase: ImporterObjectifsUseCase;
  objectifRepository: ObjectifRepository;
  publierObjectifUseCase: PublierObjectifUseCase;
  enregistrerBrouillonObjectifUseCase: EnregistrerBrouillonObjectifUseCase;
  publierBrouillonObjectifUseCase: PublierBrouillonObjectifUseCase;
  modifierBrouillonObjectifUseCase: ModifierBrouillonObjectifUseCase;
  modifierObjectifPublieUseCase: ModifierObjectifPublieUseCase;
  recupererDerniersObjectifsQuery: RecupererDerniersObjectifsQuery;
  recupererBrouillonObjectifQuery: RecupererBrouillonObjectifQuery;
  recupererHistoriqueObjectifQuery: RecupererHistoriqueObjectifQuery;
};

export const objectifModule = defineModule<NoExports, ObjectifCradle>()({
  name: "objectif",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      objectifRepository: asModuleClass(ObjectifSQLRepository),
      importerObjectifsUseCase: asModuleClass(ImporterObjectifsUseCase),
      importObjectifAPIHandler: asModuleClass(ImportObjectifAPIHandler),
      publierObjectifUseCase: asModuleClass(PublierObjectifUseCase),
      enregistrerBrouillonObjectifUseCase: asModuleClass(
        EnregistrerBrouillonObjectifUseCase,
      ),
      publierBrouillonObjectifUseCase: asModuleClass(
        PublierBrouillonObjectifUseCase,
      ),
      modifierBrouillonObjectifUseCase: asModuleClass(
        ModifierBrouillonObjectifUseCase,
      ),
      modifierObjectifPublieUseCase: asModuleClass(
        ModifierObjectifPublieUseCase,
      ),
      recupererDerniersObjectifsQuery: asModuleClass(
        RecupererDerniersObjectifsQuery,
      ),
      recupererBrouillonObjectifQuery: asModuleClass(
        RecupererBrouillonObjectifQuery,
      ),
      recupererHistoriqueObjectifQuery: asModuleClass(
        RecupererHistoriqueObjectifQuery,
      ),
    } satisfies Record<keyof ObjectifCradle, unknown>);
  },
});

type Scope = ExtractScope<typeof objectifModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
