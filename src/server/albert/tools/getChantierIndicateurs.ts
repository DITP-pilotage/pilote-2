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
  afficher: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      "Si true (par défaut), les résultats seront affichés dans un tableau visuel dans l'interface. Mettre à false quand les données sont récupérées pour un traitement interne (ex: génération de rapport via export_rapport).",
    ),
});

export type GetChantierIndicateursOutput = {
  resultats: GetChantierIndicateursResult;
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS_AFFICHER = `Les valeurs des indicateurs seront automatiquement affichées dans un tableau visuel dans l'interface.
Ne reproduis JAMAIS les données des indicateurs (VI, VA, VC, TA) dans ta réponse textuelle, ni sous forme de tableau, ni sous forme de liste, ni dans le texte.
Tu peux ajouter un bref commentaire factuel sur les résultats si pertinent, sans répéter les valeurs.`;

const OUTPUT_INSTRUCTIONS_MASQUER = `Les données des indicateurs ont été récupérées pour un traitement interne. Elles ne seront pas affichées dans l'interface. Utilise-les pour la suite du traitement (ex: génération de rapport).`;

export function createGetChantierIndicateursTool({
  getChantierIndicateursQuery,
}: {
  getChantierIndicateursQuery: GetChantierIndicateursQuery;
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
          _output_instructions: input.afficher
            ? OUTPUT_INSTRUCTIONS_AFFICHER
            : OUTPUT_INSTRUCTIONS_MASQUER,
        };
      },
    });
  };
}
