import { tool } from "ai";
import { z } from "zod";
import { GetTauxAvancementTerritoireQuery } from "@/server/chantiers/query/GetTauxAvancementTerritoireQuery";
import type { GetTauxAvancementTerritoireResult } from "@/server/chantiers/query/GetTauxAvancementTerritoireQuery";

const getTauxAvancementTerritoireInputSchema = z.object({
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

export type GetTauxAvancementTerritoireOutput = GetTauxAvancementTerritoireResult;

export function createGetTauxAvancementTerritoireTool({
  getTauxAvancementTerritoireQuery,
}: {
  getTauxAvancementTerritoireQuery: GetTauxAvancementTerritoireQuery;
}) {
  return ({ territoiresAccessibles }: { territoiresAccessibles: string[] }) => {
    return tool({
      description: `Récupère le taux d'avancement global d'un territoire, la médiane de répartition et la position du territoire par rapport à la médiane.

Utilise cet outil quand l'utilisateur demande :
- Le taux d'avancement d'un territoire
- La position d'un territoire par rapport à la médiane
- Une vue d'ensemble rapide d'un territoire`,
      inputSchema: getTauxAvancementTerritoireInputSchema,
      execute: async (
        input,
      ): Promise<GetTauxAvancementTerritoireOutput> => {
        if (!territoiresAccessibles.includes(input.territoire_code)) {
          throw new Error(
            `Accès non autorisé au territoire ${input.territoire_code}`,
          );
        }

        return getTauxAvancementTerritoireQuery.execute({
          territoireCode: input.territoire_code,
          jalon: input.jalon,
        });
      },
    });
  };
}
