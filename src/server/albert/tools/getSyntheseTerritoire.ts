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
    description: `Récupère la synthèse détaillée d'un territoire. Cet outil retourne :
- Le taux d'avancement global du territoire
- La position du territoire par rapport à la médiane de répartition
- Les chantiers en retard (écart <= -10) avec leurs métriques détaillées
- Les chantiers en difficulté (météo ORAGE ou NUAGE) avec leurs synthèses

Utilise cet outil quand l'utilisateur demande :
- Une analyse d'un territoire spécifique
- Une comparaison territoriale
- Des détails sur les chantiers problématiques d'un territoire`,
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
