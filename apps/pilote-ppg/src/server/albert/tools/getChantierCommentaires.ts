import { tool } from "ai";
import { z } from "zod";
import { chantierIdSchema } from "@/server/albert/tools/chantierId";
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
import { texteDepuisHtml } from "@/server/albert/tools/texteDepuisHtml";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import {
  descriptionPerimetre,
  resoudrePerimetreAccessible,
  TERRITOIRE_NATIONAL,
  variantesPerimetre,
} from "@/server/albert/tools/perimetre";

export type { TypeContenuChantier };

export const getChantierCommentairesInputSchema = z.object({
  chantier_id: chantierIdSchema,
  perimetre: z
    .discriminatedUnion("type", [
      variantesPerimetre.SELECTION,
      variantesPerimetre.REGION_ET_SES_DEPARTEMENTS,
      variantesPerimetre.FRANCE_ET_SES_REGIONS,
    ])
    .describe(
      descriptionPerimetre({
        types: [
          "SELECTION",
          "REGION_ET_SES_DEPARTEMENTS",
          "FRANCE_ET_SES_REGIONS",
        ],
      }),
    ),
  types: z
    .array(z.enum(typesContenuChantier))
    .optional()
    .describe(
      "Types de contenus à récupérer. Omettre pour tout récupérer. Les types nationaux sont automatiquement recherchés au niveau national (NAT-FR) si l'utilisateur y a accès, même quand le périmètre est régional ou départemental.",
    ),
});

type VersionCommentaire = {
  date_publication: string;
  contenu: string;
};

type CommentaireAvecVersions = {
  type: string;
  versions: VersionCommentaire[];
};

type ResultatCommentaires = Omit<
  GetChantierCommentairesResult,
  "commentaires"
> & {
  commentaires: CommentaireAvecVersions[];
};

export type GetChantierCommentairesInput = z.infer<
  typeof getChantierCommentairesInputSchema
>;

export type GetChantierCommentairesOutput = {
  /** Le nom à écrire avec l'identifiant (« CH-XXX — Nom ») : sans lui, la réponse citait le chantier par son seul code. */
  chantier_nom: string | null;
  resultats: ResultatCommentaires[];
  types_non_accessibles: GetChantierCommentairesQueryResult["types_non_accessibles"];
};

const normaliserEspaces = (texte: string) => texte.replace(/\s+/g, " ");

/**
 * Chaque enregistrement d'un commentaire en publie une nouvelle version. Rendues
 * à plat, les 34 versions des 3 commentaires de CH-062 en Bretagne passaient
 * pour des doublons, que le modèle restituait en « (idem) » (PIL-1900). On garde
 * l'historique pour l'analyse, groupé par type et sans les versions identiques
 * à la précédente.
 */
function regrouperParType({
  commentaires,
}: {
  commentaires: GetChantierCommentairesResult["commentaires"];
}): CommentaireAvecVersions[] {
  const versionsParType = new Map<string, VersionCommentaire[]>();
  const duPlusRecentAuPlusAncien = commentaires.toSorted((left, right) =>
    right.date_publication.localeCompare(left.date_publication),
  );

  // Du plus récent au plus ancien : le premier type rencontré est le dernier mis
  // à jour, et une version identique à la dernière retenue est plus ancienne, on
  // garde donc la date la plus récente.
  for (const commentaire of duPlusRecentAuPlusAncien) {
    const contenu = texteDepuisHtml({ html: commentaire.contenu });
    const versions = versionsParType.get(commentaire.type) ?? [];
    const derniereVersionRetenue = versions.at(-1);

    if (
      derniereVersionRetenue &&
      normaliserEspaces(derniereVersionRetenue.contenu) ===
        normaliserEspaces(contenu)
    ) {
      continue;
    }

    versions.push({ date_publication: commentaire.date_publication, contenu });
    versionsParType.set(commentaire.type, versions);
  }

  return [...versionsParType].map(([type, versions]) => ({ type, versions }));
}

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
      description: `Renvoie les commentaires publiés d'un chantier sur les territoires du périmètre, un par type, regroupés par territoire (\`territoire_nom\` : le territoire pour lequel ils sont rédigés).
- \`chantier_nom\` : le nom du chantier, à écrire avec son identifiant (« CH-XXX — Nom »).
- \`versions\` : l'historique des publications d'un même commentaire, de la plus récente à la plus ancienne ; la première est celle en vigueur. Pour une analyse, décris l'évolution plutôt que de restituer chaque version.

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
Utilise-le pour : les commentaires, freins, actions, réussites ou décisions d'un chantier sur un territoire ; plusieurs territoires (« la Bretagne et ses départements ») : un seul appel avec le \`perimetre\` adapté.
Ne l'utilise pas pour : l'ambition du chantier, ce qui a été fait ou ce qu'il reste à faire → get_chantier_objectifs.`,
      inputSchema: getChantierCommentairesInputSchema,
      execute: async (input): Promise<GetChantierCommentairesOutput> => {
        const perimetreAccessible = await resoudrePerimetreAccessible({
          perimetre: input.perimetre,
          territoiresAccessibles,
          territoireResolver,
        });
        if ("territoireInaccessible" in perimetreAccessible) {
          throw new Error(
            `Accès non autorisé au territoire ${perimetreAccessible.territoireInaccessible}`,
          );
        }
        const codesAccessibles = perimetreAccessible.codes;

        if (!chantiersAccessibles.includes(input.chantier_id)) {
          throw new Error(
            `Accès non autorisé au chantier ${input.chantier_id}`,
          );
        }

        const typesDemandes = input.types ?? [...typesContenuChantier];

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
          resultats: results
            .flatMap((result) => result.resultats)
            .map((resultat) => ({
              ...resultat,
              commentaires: regrouperParType({
                commentaires: resultat.commentaires,
              }),
            })),
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
