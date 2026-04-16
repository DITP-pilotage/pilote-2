import { createGetTauxAvancementTerritoireTool } from "@/server/albert/tools/getTauxAvancementTerritoire";
import { createGetChantiersTool } from "@/server/albert/tools/getChantiers";
import { createGetChantierIndicateursTool } from "@/server/albert/tools/getChantierIndicateurs";
import { createComposeDashboardTool } from "@/server/albert/tools/composeDashboard";
import type { ChantierExports } from "@/server/chantiers/module";
import { EvaluerChatUseCase } from "@/server/albert/usecases/EvaluerChatUseCase";
import { PrismaTerritoireResolver } from "@/server/albert/infrastructure/PrismaTerritoireResolver";
import { FsRapportFileStorage } from "@/server/albert/infrastructure/FsRapportFileStorage";
import { createExportRapportTool } from "@/server/albert/tools/exportRapport";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import type { RapportFileStorage } from "@/server/albert/domain/RapportFileStorage";
import {
  defineModule,
  type ExtractScope,
  type NoExports,
  type VerifyCradle,
} from "@/server/module-system";
import type { SharedDependencies } from "@/server/shared/module";

type AlbertImports = SharedDependencies & ChantierExports;

type AlbertOwnCradle = {
  territoireResolver: TerritoireResolver;
  rapportFileStorage: RapportFileStorage;
  createGetTauxAvancementTerritoireTool: ReturnType<
    typeof createGetTauxAvancementTerritoireTool
  >;
  createGetChantiersTool: ReturnType<typeof createGetChantiersTool>;
  createGetChantierIndicateursTool: ReturnType<
    typeof createGetChantierIndicateursTool
  >;
  createComposeDashboardTool: ReturnType<typeof createComposeDashboardTool>;
  createExportRapportTool: ReturnType<typeof createExportRapportTool>;
  evaluerChatUseCase: EvaluerChatUseCase;
};

type AlbertCradle = AlbertOwnCradle & AlbertImports;

export const albertModule = defineModule<NoExports, AlbertCradle>()({
  name: "albert",
  imports: ["shared", "chantiers"],
  exports: [],
  register: (container, { asModuleFunction, asModuleClass }) => {
    container.register({
      territoireResolver: asModuleClass(PrismaTerritoireResolver),
      rapportFileStorage: asModuleClass(FsRapportFileStorage),
      createGetTauxAvancementTerritoireTool: asModuleFunction(
        createGetTauxAvancementTerritoireTool,
      ),
      createGetChantiersTool: asModuleFunction(createGetChantiersTool),
      createGetChantierIndicateursTool: asModuleFunction(
        createGetChantierIndicateursTool,
      ),
      createComposeDashboardTool: asModuleFunction(createComposeDashboardTool),
      createExportRapportTool: asModuleFunction(createExportRapportTool),
      evaluerChatUseCase: asModuleClass(EvaluerChatUseCase),
    } satisfies VerifyCradle<AlbertOwnCradle>);
  },
});

type Scope = ExtractScope<typeof albertModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
