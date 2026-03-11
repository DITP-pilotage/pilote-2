import { asClass } from "awilix";
import { GetChantiersEnRetardQuery } from "@/server/chantiers/query/GetChantiersEnRetardQuery";
import { GetChantiersEnDifficulteQuery } from "@/server/chantiers/query/GetChantiersEnDifficulteQuery";
import { createGetTauxAvancementTerritoireTool } from "@/server/albert/tools/getTauxAvancementTerritoire";
import { createGetChantiersEnRetardTool } from "@/server/albert/tools/getChantiersEnRetard";
import { createGetChantiersEnDifficulteTool } from "@/server/albert/tools/getChantiersEnDifficulte";
import { GetValeursIndicateurQuery } from "@/server/chantiers/query/GetValeursIndicateurQuery";
import { createGetValeursIndicateurTool } from "@/server/albert/tools/getValeursIndicateur";
import { EvaluerChatUseCase } from "@/server/albert/usecases/EvaluerChatUseCase";
import { defineModule, type NoExports } from "@/server/module-system";
import type { PrismaPilote } from "@/server/db/PrismaPilote";

type AlbertCradle = NoExports & {
  prisma: PrismaPilote;
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

export const albertModule = defineModule<NoExports, AlbertCradle>()({
  name: "albert",
  imports: ["shared"],
  exports: [],
  register: (container, { asModuleFunction }) => {
    container.register({
      createGetTauxAvancementTerritoireTool: asModuleFunction(
        createGetTauxAvancementTerritoireTool,
      ),
      getChantiersEnRetardQuery: asClass(GetChantiersEnRetardQuery),
      createGetChantiersEnRetardTool: asModuleFunction(createGetChantiersEnRetardTool),
      getChantiersEnDifficulteQuery: asClass(GetChantiersEnDifficulteQuery),
      createGetChantiersEnDifficulteTool: asModuleFunction(
        createGetChantiersEnDifficulteTool,
      ),
      getValeursIndicateurQuery: asClass(GetValeursIndicateurQuery),
      createGetValeursIndicateurTool: asModuleFunction(createGetValeursIndicateurTool),
      evaluerChatUseCase: asClass(EvaluerChatUseCase),
    });
  },
});
