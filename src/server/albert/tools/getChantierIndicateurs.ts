import { tool } from "ai";
import { z } from "zod";
import { GetChantierIndicateursQuery } from "@/server/chantiers/query/GetChantierIndicateursQuery";
import type { GetChantierIndicateursResult } from "@/server/chantiers/query/GetChantierIndicateursQuery";

export const getChantierIndicateursInputSchema = z.object({
  chantier_id: z.string().describe("Identifiant du chantier (ex: CH-001)"),
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
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS = `Les données des indicateurs ont été récupérées. Utilise-les pour la suite du traitement (ex: génération de rapport, composition de dashboard).
Pour afficher les indicateurs à l'utilisateur, utilise create_dashboard avec un widget_tableau_indicateurs_chantier.`;

export function createGetChantierIndicateursTool({
  getChantierIndicateursQuery,
}: {
  getChantierIndicateursQuery: GetChantierIndicateursQuery;
}) {
  return ({ territoiresAccessibles }: { territoiresAccessibles: string[] }) => {
    return tool({
      description: `Récupère les valeurs des indicateurs de suivi (VI, VA, VC, TA) d'un chantier sur un territoire donné.

⚠️ Cet outil ne sert PAS à obtenir les informations générales d'un chantier (météo, écart, tendance, synthèse). Pour cela, utilise get_chantiers en mode par_id.

Utilise cet outil UNIQUEMENT quand l'utilisateur demande explicitement :
- Les indicateurs de suivi d'un chantier
- Les valeurs VI, VA, VC ou le détail des mesures
- Pour alimenter un export de rapport (étape indicateurs)`,
      inputSchema: getChantierIndicateursInputSchema,
      execute: async (input): Promise<GetChantierIndicateursOutput> => {
        if (!territoiresAccessibles.includes(input.territoire_code)) {
          throw new Error(
            `Accès non autorisé au territoire ${input.territoire_code}`,
          );
        }

        const result = await getChantierIndicateursQuery.execute({
          territoireCode: input.territoire_code,
          chantierId: input.chantier_id,
          jalon: input.jalon,
        });

        return {
          resultats: result,
          _output_instructions: OUTPUT_INSTRUCTIONS,
        };
      },
    });
  };
}
