import { tool } from "ai";
import { z } from "zod";
import { GetChantierObjectifsQuery } from "@/server/chantiers/query/GetChantierObjectifsQuery";
import type { GetChantierObjectifsResult } from "@/server/chantiers/query/GetChantierObjectifsQuery";

export const getChantierObjectifsInputSchema = z.object({
  chantier_id: z.string().describe("Identifiant du chantier (ex: CH-001)"),
});

export type GetChantierObjectifsOutput = GetChantierObjectifsResult & {
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS = `Restitue chaque objectif avec sa date et son contenu verbatim, sans reformulation ni interprétation. Le contenu est en HTML : extrais uniquement le texte (sans les balises) tout en conservant la formulation d'origine. Ces objectifs représentent la vision nationale du chantier — ils ne sont pas spécifiques à un territoire donné. Ne reformule ou ne synthétise que si l'utilisateur le demande explicitement.`;

export function createGetChantierObjectifsTool({
  getChantierObjectifsQuery,
}: {
  getChantierObjectifsQuery: GetChantierObjectifsQuery;
}) {
  return ({ chantiersAccessibles }: { chantiersAccessibles: string[] }) => {
    return tool({
      description: `Récupère les objectifs publiés d'un chantier (uniquement les objectifs publiés — les brouillons sont exclus) :
- \`notre_ambition\` : ambition politique du chantier, objectifs, indicateurs et leviers
- \`deja_fait\` : principales avancées déjà réalisées
- \`a_faire\` : objectifs prioritaires et principales actions restant à mener

Ces objectifs sont rattachés au chantier au niveau national et ne sont pas territorialisés. Un champ \`null\` signifie qu'aucun objectif publié n'existe pour ce type.

Utilise cet outil quand l'utilisateur demande l'ambition, les objectifs stratégiques, ce qui a été fait ou ce qu'il reste à faire sur un chantier — indépendamment d'un territoire.`,
      inputSchema: getChantierObjectifsInputSchema,
      execute: async (input): Promise<GetChantierObjectifsOutput> => {
        if (!chantiersAccessibles.includes(input.chantier_id)) {
          throw new Error(
            `Accès non autorisé au chantier ${input.chantier_id}`,
          );
        }

        const result = await getChantierObjectifsQuery.execute(
          input.chantier_id,
        );

        return {
          ...result,
          _output_instructions: OUTPUT_INSTRUCTIONS,
        };
      },
    });
  };
}
