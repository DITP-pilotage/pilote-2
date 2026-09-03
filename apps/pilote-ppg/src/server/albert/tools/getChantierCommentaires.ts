import { tool } from "ai";
import { z } from "zod";
import {
  GetChantierCommentairesQuery,
  typesContenuChantier,
} from "@/server/chantiers/query/GetChantierCommentairesQuery";
import type {
  GetChantierCommentairesQueryResult,
  GetChantierCommentairesResult,
  TypeContenuChantier,
} from "@/server/chantiers/query/GetChantierCommentairesQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";

export type { TypeContenuChantier };

const TERRITOIRE_NATIONAL = "NAT-FR";

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
  types: z
    .array(z.enum(typesContenuChantier))
    .optional()
    .describe(
      "Types de contenus à récupérer. Omettre pour tout récupérer. Les types nationaux sont automatiquement recherchés au niveau national (NAT-FR) si l'utilisateur y a accès, même quand territoire_code est régional ou départemental.",
    ),
});

export type GetChantierCommentairesOutput = {
  resultats: GetChantierCommentairesResult[];
  types_non_accessibles: GetChantierCommentairesQueryResult["types_non_accessibles"];
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS = `Restitue chaque commentaire avec sa date, son contenu verbatim et la mention "Rédigé pour <territoire_nom>", sans reformulation ni interprétation. Les contenus sont en HTML : extrais uniquement le texte (sans les balises) tout en conservant la formulation d'origine. Regroupe par type ou trie par date selon la demande de l'utilisateur. N'affiche pas territoire_code : ce code est technique et ne doit pas apparaître dans la réponse finale. Ne reformule ou ne synthétise que si l'utilisateur le demande explicitement.
Si types_non_accessibles n'est pas vide, ces types sont hors du périmètre d'accès de l'utilisateur : ne dis JAMAIS qu'il n'existe pas de contenu pour ces types — indique que l'utilisateur n'a pas accès à ces informations (elles relèvent de la vue nationale).`;

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

Chaque bloc de résultat porte \`territoire_nom\` : utilise ce nom lisible pour afficher "Rédigé pour <territoire_nom>" et n'affiche jamais \`territoire_code\` à l'utilisateur.

Chaque commentaire porte un champ \`type\` permettant de distinguer la nature du contenu et sa maille :
- \`freins_a_lever\` (maille nationale uniquement) : risques et freins à lever, notamment ceux nécessitant un soutien ou un arbitrage
- \`actions_a_venir\` (maille nationale uniquement) : solutions envisagées et actions initiées ou prévues
- \`actions_a_valoriser\` (maille nationale uniquement) : exemples concrets de réussite à partager
- \`autres_resultats_obtenus_non_correles_aux_indicateurs\` (maille nationale uniquement) : résultats importants qui ne transparaissent pas dans les indicateurs
- \`decision_strategique\` (maille nationale uniquement) : décisions prises lors des réunions Élysée-Matignon et actions envisagées ou réalisées
- \`commentaires_sur_les_donnees\` (mailles régionale et départementale) : explication des résultats du territoire et des écarts avec les autres territoires
- \`autres_resultats_obtenus\` (mailles régionale et départementale) : résultats locaux qui ne transparaissent pas dans les chiffres
- \`synthese_des_resultats\` (toutes mailles) : commentaire d'analyse accompagnant la météo du chantier sur le territoire

Les types nationaux sont automatiquement recherchés sur NAT-FR quand l'utilisateur y a accès, même si territoire_code est régional ou départemental : inutile de faire un second appel sur NAT-FR pour les obtenir. Les types listés dans types_non_accessibles sont hors du périmètre d'accès de l'utilisateur.

Utilise cet outil quand l'utilisateur demande l'analyse qualitative ou contextuelle d'un chantier sur un territoire : freins, actions, réussites, décisions stratégiques ou commentaires explicatifs. Pour les objectifs stratégiques du chantier (ambition, ce qui a été fait, ce qu'il reste à faire), utilise \`get_chantier_objectifs\`.`,
      inputSchema: getChantierCommentairesInputSchema,
      execute: async (input): Promise<GetChantierCommentairesOutput> => {
        if (!territoiresAccessibles.includes(input.territoire_code)) {
          throw new Error(
            `Accès non autorisé au territoire ${input.territoire_code}`,
          );
        }

        const typesDemandes = input.types ?? [...typesContenuChantier];

        const codes = await territoireResolver.resoudre(
          input.territoire_code,
          input.include_sous_territoires,
        );
        const codesAccessibles = codes.filter((code) =>
          territoiresAccessibles.includes(code),
        );

        const result = await getChantierCommentairesQuery.execute({
          chantierId: input.chantier_id,
          territoireCodes: codesAccessibles,
          types: typesDemandes,
          inclureCommentairesNationaux:
            territoiresAccessibles.includes(TERRITOIRE_NATIONAL),
        });

        return {
          ...result,
          _output_instructions: OUTPUT_INSTRUCTIONS,
        };
      },
    });
  };
}
