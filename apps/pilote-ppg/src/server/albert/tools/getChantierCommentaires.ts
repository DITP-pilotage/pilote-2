import { tool } from "ai";
import { z } from "zod";
import { GetChantierCommentairesQuery } from "@/server/chantiers/query/GetChantierCommentairesQuery";
import type { GetChantierCommentairesResult } from "@/server/chantiers/query/GetChantierCommentairesQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";

export const getChantierCommentairesInputSchema = z.object({
  chantier_id: z.string().describe("Identifiant du chantier (ex: CH-001)"),
  territoire_code: z
    .string()
    .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
  include_sous_territoires: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Si true, inclut les commentaires des sous-territoires (ex: départements d'une région, ou toutes les régions depuis NAT-FR). Les objectifs du chantier ne sont retournés que pour le territoire principal puisqu'ils ne sont pas territorialisés.",
    ),
});

export type GetChantierCommentairesOutput = {
  resultats: GetChantierCommentairesResult[];
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS = `Restitue chaque commentaire avec sa date, son auteur et son contenu verbatim, sans reformulation ni interprétation. Les contenus sont en HTML : extrais uniquement le texte (sans les balises) tout en conservant la formulation d'origine. Regroupe par type ou trie par date selon la demande de l'utilisateur. Ne reformule ou ne synthétise que si l'utilisateur le demande explicitement.`;

export function createGetChantierCommentairesTool({
  getChantierCommentairesQuery,
  territoireResolver,
}: {
  getChantierCommentairesQuery: GetChantierCommentairesQuery;
  territoireResolver: TerritoireResolver;
}) {
  return ({ territoiresAccessibles }: { territoiresAccessibles: string[] }) => {
    return tool({
      description: `Récupère les contenus textuels publiés rattachés à un chantier sur un territoire donné (uniquement les contenus publiés — les brouillons sont exclus).
Quand include_sous_territoires=true, retourne aussi les commentaires de chaque sous-territoire.

Chaque résultat porte un champ \`type\` permettant de distinguer la nature du contenu :
- \`synthese_des_resultats\` : commentaire d'analyse accompagnant la météo de la synthèse du chantier sur le territoire
- \`commentaires_sur_les_donnees\` : commentaires explicatifs sur les données du chantier sur le territoire
- \`freins_a_lever\` : risques et freins à lever identifiés sur le territoire
- \`actions_a_venir\` : solutions et actions à venir prévues sur le territoire
- \`actions_a_valoriser\` : exemples concrets de réussite à valoriser sur le territoire
- \`autres_resultats_obtenus_non_correles_aux_indicateurs\` : autres résultats obtenus non corrélés aux indicateurs sur le territoire

Utilise cet outil quand l'utilisateur demande l'analyse qualitative ou contextuelle d'un chantier sur un territoire : freins, actions, réussites ou commentaires explicatifs. Pour les objectifs stratégiques du chantier (ambition, ce qui a été fait, ce qu'il reste à faire), utilise \`get_chantier_objectifs\`.`,
      inputSchema: getChantierCommentairesInputSchema,
      execute: async (input): Promise<GetChantierCommentairesOutput> => {
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
            getChantierCommentairesQuery.execute({
              territoireCode: code,
              chantierId: input.chantier_id,
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
