import { tool } from "ai";
import { z } from "zod";
import { GetChantiersEnRetardQuery } from "@/server/chantiers/query/GetChantiersEnRetardQuery";
import type { GetChantiersEnRetardResult } from "@/server/chantiers/query/GetChantiersEnRetardQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";

export const getChantiersEnRetardInputSchema = z.object({
  territoire_code: z
    .string()
    .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
  jalon: z
    .number()
    .int()
    .min(2022)
    .max(new Date().getFullYear())
    .describe("Année du jalon (ex: 2024, 2025)"),
  include_sous_territoires: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Si true, inclut les données des sous-territoires (ex: départements d'une région)",
    ),
});

export type GetChantiersEnRetardOutput = {
  resultats: GetChantiersEnRetardResult[];
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS = `Pour chaque chantier en retard, indique l'écart par rapport à la médiane (en points) et la météo de la synthèse si disponible.`;

export function createGetChantiersEnRetardTool({
  getChantiersEnRetardQuery,
  territoireResolver,
}: {
  getChantiersEnRetardQuery: GetChantiersEnRetardQuery;
  territoireResolver: TerritoireResolver;
}) {
  return ({ territoiresAccessibles }: { territoiresAccessibles: string[] }) => {
    return tool({
      description: `Récupère les chantiers en retard (écart <= -10 points par rapport à la médiane) d'un territoire.
Quand include_sous_territoires=true, retourne aussi les chantiers en retard de chaque sous-territoire.

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

        const codes = await territoireResolver.resoudre(
          input.territoire_code,
          input.include_sous_territoires,
        );
        const codesAccessibles = codes.filter((code) =>
          territoiresAccessibles.includes(code),
        );

        const resultats = await Promise.all(
          codesAccessibles.map((code) =>
            getChantiersEnRetardQuery.execute({
              territoireCode: code,
              jalon: input.jalon,
            }),
          ),
        );

        return {
          resultats,
          _output_instructions: OUTPUT_INSTRUCTIONS,
        };
      },
    });
  };
}
