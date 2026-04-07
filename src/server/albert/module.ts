import { GetChantiersEnRetardQuery } from "@/server/chantiers/query/GetChantiersEnRetardQuery";
import { GetChantiersEnDifficulteQuery } from "@/server/chantiers/query/GetChantiersEnDifficulteQuery";
import { createGetTauxAvancementTerritoireTool } from "@/server/albert/tools/getTauxAvancementTerritoire";
import { createGetChantiersEnRetardTool } from "@/server/albert/tools/getChantiersEnRetard";
import { createGetChantiersEnDifficulteTool } from "@/server/albert/tools/getChantiersEnDifficulte";
import { GetValeursIndicateurQuery } from "@/server/chantiers/query/GetValeursIndicateurQuery";
import { createGetValeursIndicateurTool } from "@/server/albert/tools/getValeursIndicateur";
import { EvaluerChatUseCase } from "@/server/albert/usecases/EvaluerChatUseCase";
import { PrismaTerritoireResolver } from "@/server/albert/infrastructure/PrismaTerritoireResolver";
import { FsRapportFileStorage } from "@/server/albert/infrastructure/FsRapportFileStorage";
import { createExportRapportTool } from "@/server/albert/Albert";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import type { RapportFileStorage } from "@/server/albert/domain/RapportFileStorage";
import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import type { SharedDependencies } from "@/server/shared/module";

type AlbertImports = SharedDependencies;

type AlbertOwnCradle = {
  territoireResolver: TerritoireResolver;
  rapportFileStorage: RapportFileStorage;
  createGetTauxAvancementTerritoireTool: ReturnType<
    typeof createGetTauxAvancementTerritoireTool
  >;
  getChantiersEnRetardQuery: GetChantiersEnRetardQuery;
  createGetChantiersEnRetardTool: ReturnType<
    typeof createGetChantiersEnRetardTool
  >;
  getChantiersEnDifficulteQuery: GetChantiersEnDifficulteQuery;
  createGetChantiersEnDifficulteTool: ReturnType<
    typeof createGetChantiersEnDifficulteTool
  >;
  getValeursIndicateurQuery: GetValeursIndicateurQuery;
  createGetValeursIndicateurTool: ReturnType<
    typeof createGetValeursIndicateurTool
  >;
  createExportRapportTool: ReturnType<typeof createExportRapportTool>;
  evaluerChatUseCase: EvaluerChatUseCase;
};

type AlbertCradle = AlbertOwnCradle & AlbertImports;

export const albertModule = defineModule<NoExports, AlbertCradle>()({
  name: "albert",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleFunction, asModuleClass }) => {
    container.register({
      territoireResolver: asModuleClass(PrismaTerritoireResolver),
      rapportFileStorage: asModuleClass(FsRapportFileStorage),
      createGetTauxAvancementTerritoireTool: asModuleFunction(
        createGetTauxAvancementTerritoireTool,
      ),
      getChantiersEnRetardQuery: asModuleClass(GetChantiersEnRetardQuery),
      createGetChantiersEnRetardTool: asModuleFunction(
        createGetChantiersEnRetardTool,
      ),
      getChantiersEnDifficulteQuery: asModuleClass(
        GetChantiersEnDifficulteQuery,
      ),
      createGetChantiersEnDifficulteTool: asModuleFunction(
        createGetChantiersEnDifficulteTool,
      ),
      getValeursIndicateurQuery: asModuleClass(GetValeursIndicateurQuery),
      createGetValeursIndicateurTool: asModuleFunction(
        createGetValeursIndicateurTool,
      ),
      createExportRapportTool: asModuleFunction(createExportRapportTool),
      evaluerChatUseCase: asModuleClass(EvaluerChatUseCase),
    } satisfies VerifyCradle<AlbertOwnCradle>);
  },
});

type Scope = ExtractScope<typeof albertModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
