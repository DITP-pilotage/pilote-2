import { tool } from "ai";
import { z } from "zod";
import { GetValeursIndicateurQuery } from "@/server/chantiers/query/GetValeursIndicateurQuery";
import type { GetValeursIndicateurResult } from "@/server/chantiers/query/GetValeursIndicateurQuery";

const getValeursIndicateurInputSchema = z.object({
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

export type GetValeursIndicateurOutput = {
  resultats: GetValeursIndicateurResult;
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS = `Les valeurs des indicateurs seront automatiquement affichées dans un tableau visuel dans l'interface.
Tu peux ajouter un bref commentaire factuel sur les résultats si pertinent.`;

export function createGetValeursIndicateurTool({
  getValeursIndicateurQuery,
}: {
  getValeursIndicateurQuery: GetValeursIndicateurQuery;
}) {
  return ({ territoiresAccessibles }: { territoiresAccessibles: string[] }) => {
    return tool({
      description: `Récupère les valeurs des indicateurs (VI, VA, VC, TA) d'un chantier sur un territoire donné. Cet outil retourne :
- La valeur initiale (VI) et sa date
- La valeur actuelle (VA) et sa date
- La valeur cible (VC) et sa date
- Le taux d'avancement (TA)

Utilise cet outil quand l'utilisateur demande :
- Les indicateurs d'un chantier spécifique sur un territoire
- L'état d'avancement détaillé d'un chantier (VA, VC, TA)
- Une comparaison entre la valeur actuelle et la cible d'un chantier`,
      inputSchema: getValeursIndicateurInputSchema,
      execute: async (input): Promise<GetValeursIndicateurOutput> => {
        if (!territoiresAccessibles.includes(input.territoire_code)) {
          throw new Error(
            `Accès non autorisé au territoire ${input.territoire_code}`,
          );
        }

        const result = await getValeursIndicateurQuery.execute({
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
