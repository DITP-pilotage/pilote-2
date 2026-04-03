import { tool } from "ai";
import { z } from "zod";
import { GetChantiersEnDifficulteQuery } from "@/server/chantiers/query/GetChantiersEnDifficulteQuery";
import type { GetChantiersEnDifficulteResult } from "@/server/chantiers/query/GetChantiersEnDifficulteQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";

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
  include_sous_territoires: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Si true, inclut les données des sous-territoires (ex: départements d'une région)",
    ),
});

export type GetChantiersEnDifficulteOutput = GetChantiersEnDifficulteResult[];

export function createGetChantiersEnDifficulteTool({
  getChantiersEnDifficulteQuery,
  territoireResolver,
}: {
  getChantiersEnDifficulteQuery: GetChantiersEnDifficulteQuery;
  territoireResolver: TerritoireResolver;
}) {
  return ({ territoiresAccessibles }: { territoiresAccessibles: string[] }) => {
    return tool({
      description: `Récupère les chantiers en difficulté (météo ORAGE ou NUAGE, hors chantiers en retard) d'un territoire.
Quand include_sous_territoires=true, retourne aussi les chantiers en difficulté de chaque sous-territoire.

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

        const codes = await territoireResolver.resoudre(
          input.territoire_code,
          input.include_sous_territoires,
        );
        const codesAccessibles = codes.filter((code) =>
          territoiresAccessibles.includes(code),
        );

        const resultats = await Promise.all(
          codesAccessibles.map((code) =>
            getChantiersEnDifficulteQuery.execute({
              territoireCode: code,
              jalon: input.jalon,
            }),
          ),
        );

        return resultats;
      },
    });
  };
}
