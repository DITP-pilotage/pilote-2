import { tool } from "ai";
import { z } from "zod";
import { GetChantiersEnDifficulteQuery } from "@/server/chantiers/query/GetChantiersEnDifficulteQuery";
import type { GetChantiersEnDifficulteResult } from "@/server/chantiers/query/GetChantiersEnDifficulteQuery";

const getChantiersEnDifficulteInputSchema = z.object({
  territoire_code: z
    .string()
    .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
  jalon: z
    .number()
    .int()
    .min(2022)
    .max(new Date().getFullYear())
    .describe("Année du jalon (ex: 2024, 2025)"),
});

export type GetChantiersEnDifficulteOutput = GetChantiersEnDifficulteResult;

export function createGetChantiersEnDifficulteTool({
  getChantiersEnDifficulteQuery,
}: {
  getChantiersEnDifficulteQuery: GetChantiersEnDifficulteQuery;
}) {
  return ({ territoiresAccessibles }: { territoiresAccessibles: string[] }) => {
    return tool({
      description: `Récupère les chantiers en difficulté (météo ORAGE ou NUAGE, hors chantiers en retard) d'un territoire.

Utilise cet outil quand l'utilisateur demande :
- Les chantiers en difficulté d'un territoire
- Les chantiers compromis ou nécessitant un appui
- Les chantiers avec une météo dégradée`,
      inputSchema: getChantiersEnDifficulteInputSchema,
      execute: async (input): Promise<GetChantiersEnDifficulteOutput> => {
        if (!territoiresAccessibles.includes(input.territoire_code)) {
          throw new Error(
            `Accès non autorisé au territoire ${input.territoire_code}`,
          );
        }

        return getChantiersEnDifficulteQuery.execute({
          territoireCode: input.territoire_code,
          jalon: input.jalon,
        });
      },
    });
  };
}
