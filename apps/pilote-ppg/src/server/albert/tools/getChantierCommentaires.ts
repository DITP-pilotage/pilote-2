import { tool } from "ai";
import { z } from "zod";
import { GetChantierCommentairesQuery } from "@/server/chantiers/query/GetChantierCommentairesQuery";
import type { GetChantierCommentairesResult } from "@/server/chantiers/query/GetChantierCommentairesQuery";

export const getChantierCommentairesInputSchema = z.object({
  chantier_id: z.string().describe("Identifiant du chantier (ex: CH-001)"),
  territoire_code: z
    .string()
    .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
});

export type GetChantierCommentairesOutput = {
  resultats: GetChantierCommentairesResult;
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS = `Présente les commentaires regroupés par type ou triés par date selon la demande de l'utilisateur. Reformule chaque contenu en 1-2 phrases factuelles, sans recopie in extenso et sans interprétation.`;

export function createGetChantierCommentairesTool({
  getChantierCommentairesQuery,
}: {
  getChantierCommentairesQuery: GetChantierCommentairesQuery;
}) {
  return ({ territoiresAccessibles }: { territoiresAccessibles: string[] }) => {
    return tool({
      description: `Récupère les contenus textuels publiés rattachés à un chantier sur un territoire donné (uniquement les contenus publiés — les brouillons sont exclus).

Les contenus proviennent de trois sources et chaque résultat porte un champ \`type\` permettant de les distinguer :

Issus de la synthèse des résultats (couple chantier × territoire) :
- \`synthese_des_resultats\` : commentaire d'analyse accompagnant la météo de la synthèse du chantier sur le territoire

Issus de la table commentaire (couple chantier × territoire) — le type est repris tel quel :
- \`commentaires_sur_les_donnees\` : commentaires explicatifs sur les données du chantier sur le territoire
- \`freins_a_lever\` : risques et freins à lever identifiés sur le territoire
- \`actions_a_venir\` : solutions et actions à venir prévues sur le territoire
- \`actions_a_valoriser\` : exemples concrets de réussite à valoriser sur le territoire
- \`autres_resultats_obtenus_non_correles_aux_indicateurs\` : autres résultats obtenus non corrélés aux indicateurs sur le territoire

Issus de la table objectif (rattachés au chantier, indépendamment du territoire) — le type est préfixé par \`objectif_\` :
- \`objectif_notre_ambition\` : ambition du chantier ("Notre ambition")
- \`objectif_deja_fait\` : ce qui a déjà été fait
- \`objectif_a_faire\` : ce qu'il reste à faire

Utilise cet outil quand l'utilisateur demande l'analyse qualitative ou contextuelle d'un chantier : ambitions, objectifs, freins, actions, réussites ou commentaires explicatifs.`,
      inputSchema: getChantierCommentairesInputSchema,
      execute: async (input): Promise<GetChantierCommentairesOutput> => {
        if (!territoiresAccessibles.includes(input.territoire_code)) {
          throw new Error(
            `Accès non autorisé au territoire ${input.territoire_code}`,
          );
        }

        const result = await getChantierCommentairesQuery.execute({
          territoireCode: input.territoire_code,
          chantierId: input.chantier_id,
        });

        return {
          resultats: result,
          _output_instructions: OUTPUT_INSTRUCTIONS,
        };
      },
    });
  };
}
