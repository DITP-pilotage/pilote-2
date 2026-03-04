import { tool } from "ai";
import { z } from "zod";
import { GetValeursIndicateurQuery } from "@/server/chantiers/query/GetValeursIndicateurQuery";
import type { GetValeursIndicateurResult } from "@/server/chantiers/query/GetValeursIndicateurQuery";
import { JALON_COURANT } from "@/server/albert/systemPrompt";

export const VALEURS_INDICATEUR_OUTPUT_FORMAT = `
<instructions>
Après avoir reçu les données de get_valeurs_indicateur, tu DOIS :
1. Écrire un titre en markdown : "# Indicateurs du chantier {nom_chantier} sur {territoire}"
2. Appeler le tool display_valeurs_indicateur en lui passant le tableau d'indicateurs tel quel
3. Écrire "Sources analysées : données quantitatives des indicateurs publiés sur PILOTE."
</instructions>
`;

const getValeursIndicateurInputSchema = z.object({
  chantier_id: z.string().describe("Identifiant du chantier (ex: CH-001)"),
  territoire_code: z
    .string()
    .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
});

export type GetValeursIndicateurOutput = GetValeursIndicateurResult;

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

        return getValeursIndicateurQuery.execute({
          territoireCode: input.territoire_code,
          chantierId: input.chantier_id,
          jalon: JALON_COURANT,
        });
      },
    });
  };
}
