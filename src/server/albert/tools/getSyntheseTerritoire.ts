import { tool } from "ai";
import { z } from "zod";
import { GetSyntheseTerritoireQuery } from "@/server/chantiers/query/GetSyntheseTerritoireQuery";
import type { GetSyntheseTerritoireResult } from "@/server/chantiers/query/GetSyntheseTerritoireQuery";
import { JALON_COURANT } from "@/server/albert/systemPrompt";

const getSyntheseTerritoireInputSchema = z.object({
  territoire_code: z
    .string()
    .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
});

export type GetSyntheseTerritoireOutput = GetSyntheseTerritoireResult;

interface CreateGetSyntheseTerritoireToolParams {
  territoiresAccessibles: string[];
  getSyntheseTerritoireQuery: GetSyntheseTerritoireQuery;
}

export function createGetSyntheseTerritoireTool({
  territoiresAccessibles,
  getSyntheseTerritoireQuery,
}: CreateGetSyntheseTerritoireToolParams) {
  return tool({
    description:
      "Récupère la synthèse détaillée d'un territoire avec ses chantiers en retard et en difficulté",
    inputSchema: getSyntheseTerritoireInputSchema,
    execute: async (input): Promise<GetSyntheseTerritoireOutput> => {
      if (!territoiresAccessibles.includes(input.territoire_code)) {
        throw new Error(
          `Accès non autorisé au territoire ${input.territoire_code}`,
        );
      }

      return getSyntheseTerritoireQuery.execute({
        territoireCode: input.territoire_code,
        jalon: JALON_COURANT,
      });
    },
  });
}
