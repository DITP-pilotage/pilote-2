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
      "Si true, inclut les contenus des sous-territoires (ex: départements d'une région, ou toutes les régions depuis NAT-FR).",
    ),
});

export type GetChantierCommentairesOutput = {
  resultats: GetChantierCommentairesResult[];
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS = `Restitue chaque contenu avec sa date et son texte verbatim, sans reformulation ni interprétation. Regroupe par type ou trie par date selon la demande de l'utilisateur. Ne reformule ou ne synthétise que si l'utilisateur le demande explicitement.`;

export function createGetChantierCommentairesTool({
  getChantierCommentairesQuery,
  territoireResolver,
}: {
  getChantierCommentairesQuery: GetChantierCommentairesQuery;
  territoireResolver: TerritoireResolver;
}) {
  return ({ territoiresAccessibles }: { territoiresAccessibles: string[] }) => {
    return tool({
      description: `Récupère les contenus qualitatifs publiés d'un chantier sur un territoire donné (brouillons exclus).
Quand include_sous_territoires=true, retourne aussi les contenus de chaque sous-territoire (régions depuis NAT-FR, départements depuis une région).

Chaque résultat expose sa \`maille\` ("nationale", "régionale" ou "départementale") et contient trois catégories :

---

**\`synthese_des_resultats\`** (toutes mailles) — bilan global du chantier sur le territoire à une date donnée.
- \`meteo\` : niveau de confiance dans l'atteinte des objectifs. Valeurs possibles : SOLEIL (Objectifs sécurisés), COUVERT (Objectifs atteignables), NUAGE (Appuis nécessaires), ORAGE (Objectifs compromis), NON_RENSEIGNEE, NON_NECESSAIRE.
- \`contenu\` : analyse textuelle associée à la météo. Peut être null si seule la météo a été renseignée.

---

**\`commentaires\`** — contenus détaillés, dont la nature dépend de la maille :

Maille nationale uniquement :
- \`autres_resultats_obtenus_non_correles_aux_indicateurs\` : résultats importants obtenus sur le chantier qui ne transparaissent pas dans les indicateurs de mesure
- \`freins_a_lever\` : principaux risques et freins identifiés, notamment ceux nécessitant un soutien ou un arbitrage de niveau national
- \`actions_a_venir\` : solutions envisagées et actions initiées ou prévues pour lever les freins ou accélérer
- \`actions_a_valoriser\` : exemples concrets de réussite à partager et à valoriser

Maille régionale et départementale uniquement :
- \`commentaires_sur_les_donnees\` : explication des résultats du territoire, des écarts éventuels avec d'autres territoires ou avec la moyenne nationale
- \`autres_resultats_obtenus\` : résultats locaux significatifs qui ne transparaissent pas dans les chiffres des indicateurs

---

**\`decisions_strategiques\`** (uniquement NAT-FR) — décisions prises lors des réunions de suivi Élysée-Matignon et actions envisagées ou réalisées en conséquence. Ce champ est vide pour tout territoire non national ou si l'utilisateur n'a pas accès au niveau national.

---

Utilise cet outil quand l'utilisateur demande l'analyse qualitative d'un chantier : météo, freins, actions, réussites, commentaires sur les données ou décisions stratégiques.
Pour les objectifs stratégiques du chantier (ambition politique, ce qui a été fait, ce qu'il reste à faire), utilise \`get_chantier_objectifs\`.`,
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
