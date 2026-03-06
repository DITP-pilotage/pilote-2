import { asClass, asFunction, AwilixContainer } from "awilix";
import { GetChantiersEnRetardQuery } from "@/server/chantiers/query/GetChantiersEnRetardQuery";
import { GetChantiersEnDifficulteQuery } from "@/server/chantiers/query/GetChantiersEnDifficulteQuery";
import { createGetTauxAvancementTerritoireTool } from "@/server/albert/tools/getTauxAvancementTerritoire";
import { createGetChantiersEnRetardTool } from "@/server/albert/tools/getChantiersEnRetard";
import { createGetChantiersEnDifficulteTool } from "@/server/albert/tools/getChantiersEnDifficulte";
import { GetValeursIndicateurQuery } from "@/server/chantiers/query/GetValeursIndicateurQuery";
import { createGetValeursIndicateurTool } from "@/server/albert/tools/getValeursIndicateur";
import { EvaluerChatUseCase } from "@/server/albert/usecases/EvaluerChatUseCase";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type AlbertDependencies = {
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

export const getAlbertContainer = (
  initialContainer: AwilixContainer<{
    prisma: PrismaPilote;
  }>,
): AwilixContainer<
  AlbertDependencies & {
    prisma: PrismaPilote;
  }
> => {
  return initialContainer.createScope<AlbertDependencies>().register({
    createGetTauxAvancementTerritoireTool: asFunction(
      createGetTauxAvancementTerritoireTool,
    ),
    getChantiersEnRetardQuery: asClass(GetChantiersEnRetardQuery),
    createGetChantiersEnRetardTool: asFunction(createGetChantiersEnRetardTool),
    getChantiersEnDifficulteQuery: asClass(GetChantiersEnDifficulteQuery),
    createGetChantiersEnDifficulteTool: asFunction(
      createGetChantiersEnDifficulteTool,
    ),
    getValeursIndicateurQuery: asClass(GetValeursIndicateurQuery),
    createGetValeursIndicateurTool: asFunction(createGetValeursIndicateurTool),
    evaluerChatUseCase: asClass(EvaluerChatUseCase),
  });
};
