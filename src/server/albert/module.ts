import { GetChantiersEnRetardQuery } from "@/server/chantiers/query/GetChantiersEnRetardQuery";
import { GetChantiersEnDifficulteQuery } from "@/server/chantiers/query/GetChantiersEnDifficulteQuery";
import { createGetTauxAvancementTerritoireTool } from "@/server/albert/tools/getTauxAvancementTerritoire";
import { createGetChantiersEnRetardTool } from "@/server/albert/tools/getChantiersEnRetard";
import { createGetChantiersEnDifficulteTool } from "@/server/albert/tools/getChantiersEnDifficulte";
import { GetValeursIndicateurQuery } from "@/server/chantiers/query/GetValeursIndicateurQuery";
import { createGetValeursIndicateurTool } from "@/server/albert/tools/getValeursIndicateur";
import { EvaluerChatUseCase } from "@/server/albert/usecases/EvaluerChatUseCase";
import {
  defineModule,
  type ExtractScope,
  type NoExports,
} from "@/server/module-system";
import type { PrismaPilote } from "@/server/db/PrismaPilote";

type AlbertImports = {
  prisma: PrismaPilote;
};

type AlbertOwnCradle = {
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
  evaluerChatUseCase: EvaluerChatUseCase;
};

type AlbertCradle = AlbertOwnCradle & AlbertImports;

export const albertModule = defineModule<NoExports, AlbertCradle>()({
  name: "albert",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleFunction, asModuleClass }) => {
    container.register({
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
      evaluerChatUseCase: asModuleClass(EvaluerChatUseCase),
    } satisfies Record<keyof AlbertOwnCradle, unknown>);
  },
});

type Scope = ExtractScope<typeof albertModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
