import { asClass, asFunction, AwilixContainer } from "awilix";
import { GetSyntheseTerritoireQuery } from "@/server/chantiers/query/GetSyntheseTerritoireQuery";
import { createGetSyntheseTerritoireTool } from "@/server/albert/tools/getSyntheseTerritoire";
import { EvaluerChatUseCase } from "@/server/albert/usecases/EvaluerChatUseCase";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type AlbertDependencies = {
  getSyntheseTerritoireQuery: GetSyntheseTerritoireQuery;
  createGetSyntheseTerritoireTool: ReturnType<
    typeof createGetSyntheseTerritoireTool
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
    evaluerChatUseCase: asClass(EvaluerChatUseCase),
  });
};
