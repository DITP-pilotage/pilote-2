import { tool } from "ai";
import { z } from "zod";
import { GetChantiersEnRetardQuery } from "@/server/chantiers/query/GetChantiersEnRetardQuery";
import type { GetChantiersEnRetardResult } from "@/server/chantiers/query/GetChantiersEnRetardQuery";

const getChantiersEnRetardInputSchema = z.object({
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

export type GetChantiersEnRetardOutput = GetChantiersEnRetardResult;

export function createGetChantiersEnRetardTool({
  getChantiersEnRetardQuery,
}: {
  getChantiersEnRetardQuery: GetChantiersEnRetardQuery;
}) {
  return ({ territoiresAccessibles }: { territoiresAccessibles: string[] }) => {
    return tool({
      description: `Récupère les chantiers en retard (écart <= -10 points par rapport à la médiane) d'un territoire.

Utilise cet outil quand l'utilisateur demande :
- Les chantiers en retard d'un territoire
- Les alertes sur un territoire
- Les chantiers qui décrochent par rapport à la médiane`,
      inputSchema: getChantiersEnRetardInputSchema,
      execute: async (input): Promise<GetChantiersEnRetardOutput> => {
        if (!territoiresAccessibles.includes(input.territoire_code)) {
          throw new Error(
            `Accès non autorisé au territoire ${input.territoire_code}`,
          );
        }

        return getChantiersEnRetardQuery.execute({
          territoireCode: input.territoire_code,
          jalon: input.jalon,
        });
      },
    });
  };
}
