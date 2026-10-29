import { tool } from "ai";
import { z } from "zod";
import { chantierIdSchema } from "@/server/albert/tools/chantierId";
import { GetChantierIndicateursQuery } from "@/server/chantiers/query/GetChantierIndicateursQuery";
import type { GetChantierIndicateursResult } from "@/server/chantiers/query/GetChantierIndicateursQuery";

export const getChantierIndicateursInputSchema = z.object({
  chantier_id: chantierIdSchema,
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

export type GetChantierIndicateursOutput = {
  resultats: GetChantierIndicateursResult;
};

export function createGetChantierIndicateursTool({
  getChantierIndicateursQuery,
}: {
  getChantierIndicateursQuery: GetChantierIndicateursQuery;
}) {
  return ({ chantiersAccessibles }: { chantiersAccessibles: string[] }) => {
    return tool({
      description: `Renvoie les indicateurs d'un chantier sur un territoire à un jalon, avec leurs valeurs initiale (VI), actuelle (VA), cible (VC) et leur taux d'avancement (TA).
Utilise-le pour : les indicateurs d'un chantier et leurs valeurs, les données d'un rapport.
Ne l'utilise pas pour :
- la situation générale d'un chantier (écart, tendance, niveau de confiance) → get_chantiers ;
- l'évolution d'un indicateur dans le temps → get_evolution_indicateur ;
- l'historique des actions sur un indicateur → get_historique_indicateur.`,
      inputSchema: getChantierIndicateursInputSchema,
      execute: async (input): Promise<GetChantierIndicateursOutput> => {
        if (!chantiersAccessibles.includes(input.chantier_id)) {
          throw new Error(
            `Accès non autorisé au chantier ${input.chantier_id}`,
          );
        }

        const result = await getChantierIndicateursQuery.execute({
          territoireCode: input.territoire_code,
          chantierId: input.chantier_id,
          jalon: input.jalon,
        });

        return { resultats: result };
      },
    });
  };
}
