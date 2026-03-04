import { asClass, asFunction, AwilixContainer } from "awilix";
import { GetSyntheseTerritoireQuery } from "@/server/chantiers/query/GetSyntheseTerritoireQuery";
import { createGetSyntheseTerritoireTool } from "@/server/albert/tools/getSyntheseTerritoire";
import { GetValeursIndicateurQuery } from "@/server/chantiers/query/GetValeursIndicateurQuery";
import { createGetValeursIndicateurTool } from "@/server/albert/tools/getValeursIndicateur";
import { EvaluerChatUseCase } from "@/server/albert/usecases/EvaluerChatUseCase";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type AlbertDependencies = {
  getSyntheseTerritoireQuery: GetSyntheseTerritoireQuery;
  createGetSyntheseTerritoireTool: ReturnType<
    typeof createGetSyntheseTerritoireTool
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
    getSyntheseTerritoireQuery: asClass(GetSyntheseTerritoireQuery),
    createGetSyntheseTerritoireTool: asFunction(
      createGetSyntheseTerritoireTool,
    ),
    getValeursIndicateurQuery: asClass(GetValeursIndicateurQuery),
    createGetValeursIndicateurTool: asFunction(createGetValeursIndicateurTool),
    evaluerChatUseCase: asClass(EvaluerChatUseCase),
  });
};
