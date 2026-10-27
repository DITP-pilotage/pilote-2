import { tool } from "ai";
import { z } from "zod";
import {
  GetChantierCommentairesQuery,
  typesContenuChantierNationaux,
  typesContenuChantier,
} from "@/server/chantiers/query/GetChantierCommentairesQuery";
import type {
  GetChantierCommentairesQueryResult,
  GetChantierCommentairesResult,
  TypeContenuChantier,
} from "@/server/chantiers/query/GetChantierCommentairesQuery";
import type { GetChantiersIdentiteQuery } from "@/server/chantiers/query/GetChantiersIdentiteQuery";
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
      "`true` pour un territoire ET ses sous-territoires : un seul appel sur le parent, jamais un appel par sous-territoire.",
    ),
  types: z
    .array(z.enum(typesContenuChantier))
    .optional()
    .describe(
      "Types de contenus à récupérer. Omettre pour tout récupérer. Les types nationaux sont automatiquement recherchés au niveau national (NAT-FR) si l'utilisateur y a accès, même quand territoire_code est régional ou départemental.",
    ),
});

export type GetChantierCommentairesOutput = {
  /** Le nom à écrire avec l'identifiant (« CH-XXX — Nom ») : sans lui, la réponse citait le chantier par son seul code. */
  chantier_nom: string | null;
  resultats: GetChantierCommentairesResult[];
  types_non_accessibles: GetChantierCommentairesQueryResult["types_non_accessibles"];
};

export function createGetChantierCommentairesTool({
  getChantierCommentairesQuery,
  territoireResolver,
  getChantiersIdentiteQuery,
}: {
  getChantierCommentairesQuery: GetChantierCommentairesQuery;
  territoireResolver: TerritoireResolver;
  getChantiersIdentiteQuery: GetChantiersIdentiteQuery;
}) {
  return ({
    territoiresAccessibles,
    chantiersAccessibles,
  }: {
    territoiresAccessibles: string[];
    chantiersAccessibles: string[];
  }) => {
    return tool({
      description: `Renvoie les commentaires publiés d'un chantier sur un territoire, chacun avec son type et sa date, regroupés par territoire (\`territoire_nom\` : le territoire pour lequel ils sont rédigés).
- \`chantier_nom\` : le nom du chantier, à écrire avec son identifiant (« CH-XXX — Nom »).

Types de commentaires :
- \`freins_a_lever\` (maille nationale uniquement) : risques et freins à lever, notamment ceux nécessitant un soutien ou un arbitrage
- \`actions_a_venir\` (maille nationale uniquement) : solutions envisagées et actions initiées ou prévues
- \`actions_a_valoriser\` (maille nationale uniquement) : exemples concrets de réussite à partager
- \`autres_resultats_obtenus_non_correles_aux_indicateurs\` (maille nationale uniquement) : résultats importants qui ne transparaissent pas dans les indicateurs
- \`decision_strategique\` (maille nationale uniquement) : décisions prises lors des réunions Élysée-Matignon et actions envisagées ou réalisées
- \`commentaires_sur_les_donnees\` (mailles régionale et départementale) : explication des résultats du territoire et des écarts avec les autres territoires
- \`autres_resultats_obtenus\` (mailles régionale et départementale) : résultats locaux qui ne transparaissent pas dans les chiffres
- \`synthese_des_resultats\` (toutes mailles) : commentaire d'analyse qui accompagne le niveau de confiance du chantier sur le territoire

- Les types nationaux sont cherchés sur NAT-FR quand l'utilisateur y a accès, même pour un territoire régional ou départemental : inutile de rappeler l'outil sur NAT-FR.
- \`types_non_accessibles\` : ces types relèvent de la vue nationale, hors du périmètre de l'utilisateur ; ce n'est pas une absence de contenu.
Utilise-le pour : les commentaires, freins, actions, réussites ou décisions d'un chantier sur un territoire ; un territoire et ses sous-territoires : un seul appel sur le parent avec \`include_sous_territoires\`.
Ne l'utilise pas pour : l'ambition du chantier, ce qui a été fait ou ce qu'il reste à faire → get_chantier_objectifs.`,
      inputSchema: getChantierCommentairesInputSchema,
      execute: async (input): Promise<GetChantierCommentairesOutput> => {
        if (!territoiresAccessibles.includes(input.territoire_code)) {
          throw new Error(
            `Accès non autorisé au territoire ${input.territoire_code}`,
          );
        }

        if (!chantiersAccessibles.includes(input.chantier_id)) {
          throw new Error(
            `Accès non autorisé au chantier ${input.chantier_id}`,
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

        const doitInclureCommentairesNationaux =
          typesDemandes.some((type) =>
            typesContenuChantierNationaux.includes(type),
          ) &&
          territoiresAccessibles.includes(TERRITOIRE_NATIONAL) &&
          !codesAccessibles.includes(TERRITOIRE_NATIONAL);

        const [chantier] = await getChantiersIdentiteQuery.execute({
          chantierIds: [input.chantier_id],
        });

        const results = await Promise.all(
          codesAccessibles.map((code, index) =>
            getChantierCommentairesQuery.execute({
              chantierId: input.chantier_id,
              territoireCode: code,
              types: typesDemandes,
              inclureCommentairesNationaux:
                doitInclureCommentairesNationaux && index === 0,
            }),
          ),
        );

        return {
          chantier_nom: chantier?.nom ?? null,
          resultats: results.flatMap((result) => result.resultats),
          types_non_accessibles: [
            ...new Set(
              results.flatMap((result) => result.types_non_accessibles),
            ),
          ],
        };
      },
    });
  };
}
