import { tool } from "ai";
import { z } from "zod";
import { chantierIdsSchema } from "@/server/albert/tools/chantierId";
import { GetChantiersQuery } from "@/server/chantiers/query/GetChantiersQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import {
  descriptionPerimetre,
  variantesPerimetre,
} from "@/server/albert/tools/perimetre";
import {
  collecterChantiers,
  type ChantierCollecte,
  type ChantiersCollectes,
  type ResultatChantiers,
} from "@/server/albert/tools/collecteChantiers";

export const getChantiersInputSchema = z.object({
  perimetre: z
    .discriminatedUnion("type", [
      variantesPerimetre.SELECTION,
      variantesPerimetre.REGION_ET_SES_DEPARTEMENTS,
      variantesPerimetre.FRANCE_ET_SES_REGIONS,
      variantesPerimetre.TOUTES_REGIONS,
      variantesPerimetre.TOUS_DEPARTEMENTS,
    ])
    .describe(
      descriptionPerimetre({
        types: [
          "SELECTION",
          "REGION_ET_SES_DEPARTEMENTS",
          "FRANCE_ET_SES_REGIONS",
          "TOUTES_REGIONS",
          "TOUS_DEPARTEMENTS",
        ],
      }),
    ),
  jalon: z
    .number()
    .int()
    .min(2022)
    .max(new Date().getFullYear())
    .describe("Année du jalon (ex: 2024, 2025)"),
  chantier_ids: chantierIdsSchema
    .optional()
    .describe(
      "Identifiants de chantiers (ex: ['CH-001', 'CH-042']). Si fourni, restreint la recherche à ces chantiers. Combinable avec les autres filtres.",
    ),
  view: z
    .enum(["all", "en_retard", "en_difficulte"])
    .optional()
    .default("all")
    .describe(
      "Vue : all (tous les chantiers), en_retard (écart ≤ -10 points à la médiane), en_difficulte (niveau de confiance « Objectifs compromis » ou « Appuis nécessaires », chantiers en retard compris)",
    ),
  tendance: z
    .enum(["HAUSSE", "BAISSE", "STAGNATION"])
    .optional()
    .describe("Filtre optionnel sur la tendance"),
  tri: z
    .enum([
      "ecart_croissant",
      "ecart_decroissant",
      "taux_croissant",
      "taux_decroissant",
    ])
    .optional()
    .describe(
      "Ordre des chantiers, tous territoires confondus : ecart_croissant (les plus en retard d'abord), ecart_decroissant, taux_croissant, taux_decroissant ; les valeurs manquantes en dernier. Sans tri, l'ordre de la vue, territoire par territoire.",
    ),
  limite: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(20)
    .describe(
      "Nombre maximal de chantiers renvoyés, tous territoires confondus, après le tri (20 par défaut, 50 au plus).",
    ),
});

export type GetChantiersInput = z.infer<typeof getChantiersInputSchema>;

type TriChantiers = NonNullable<GetChantiersInput["tri"]>;

/** Un chantier tel que l'outil le donne au modèle : celui de la collecte, sans la synthèse des résultats. */
export type ChantierRenvoye = Omit<ChantierCollecte, "synthese">;

export type GetChantiersOutput = ChantiersCollectes<ChantierRenvoye> & {
  /** Le nombre de chantiers, tous territoires confondus, avant la limite. */
  total?: number;
  tronque?: true;
};

/**
 * La synthèse des résultats reste dans la collecte, que lisent les encarts,
 * mais pas dans ce que lit le modèle : il la prenait pour l'ensemble des
 * commentaires et n'appelait pas `get_chantier_commentaires`.
 */
export function retirerSynthese(
  collecte: ChantiersCollectes,
): ChantiersCollectes<ChantierRenvoye> {
  return {
    ...collecte,
    resultats: collecte.resultats.map((resultat) => ({
      ...resultat,
      chantiers: resultat.chantiers.map(
        ({ synthese: _synthese, ...chantier }) => chantier,
      ),
    })),
  };
}

/** Ce que le tri lit d'un chantier. */
type ChantierClassable = Pick<ChantierCollecte, "ecart" | "taux_avancement">;

const CRITERES_DE_TRI: Record<
  TriChantiers,
  { valeur: (chantier: ChantierClassable) => number | null; sens: 1 | -1 }
> = {
  ecart_croissant: { valeur: (chantier) => chantier.ecart, sens: 1 },
  ecart_decroissant: { valeur: (chantier) => chantier.ecart, sens: -1 },
  taux_croissant: { valeur: (chantier) => chantier.taux_avancement, sens: 1 },
  taux_decroissant: {
    valeur: (chantier) => chantier.taux_avancement,
    sens: -1,
  },
};

/**
 * Le tri et la limite de l'outil, appliqués en mémoire après la requête, sur
 * les couples (territoire, chantier) tous territoires confondus : « les plus
 * en retard de tous les départements » est un classement global.
 *
 * En mémoire parce que les encarts partagent la collecte et ne doivent être
 * ni triés ni tronqués. Le coût : TOUS_DEPARTEMENTS en vue `all` charge les
 * chantiers des 101 départements avant d'en garder `limite`. Si c'est trop
 * lent, trier et limiter en SQL : une première requête sur
 * `chantier_territoire_jalon` (qui porte l'écart et le taux), triée et
 * limitée, puis le détail des seuls chantiers retenus — les chantiers sans
 * ligne de jalon sortiraient alors de la vue `all`.
 *
 * Générique sur le chantier : l'outil lui passe la collecte sans la
 * synthèse, la fiche de vérité des evals la collecte entière.
 */
export function classerChantiers<Chantier extends ChantierClassable>({
  sortie,
  tri,
  limite,
}: {
  sortie: ChantiersCollectes<Chantier>;
  tri?: TriChantiers;
  limite?: number;
}): ChantiersCollectes<Chantier> & { total: number; tronque?: true } {
  const lignes = sortie.resultats.flatMap((resultat) =>
    resultat.chantiers.map((chantier) => ({ resultat, chantier })),
  );
  const critere = tri ? CRITERES_DE_TRI[tri] : undefined;
  const triees = critere
    ? [...lignes].sort((ligneA, ligneB) => {
        const valeurA = critere.valeur(ligneA.chantier);
        const valeurB = critere.valeur(ligneB.chantier);
        if (valeurA === null) return valeurB === null ? 0 : 1;
        if (valeurB === null) return -1;
        return critere.sens * (valeurA - valeurB);
      })
    : lignes;
  const retenues = triees.slice(0, limite);
  const tronque = retenues.length < lignes.length;

  // Les territoires dans l'ordre de leur premier chantier retenu. Sans
  // coupure, ceux qui n'en ont pas restent à la suite : « aucun chantier en
  // retard en Bretagne » est une réponse.
  const chantiersParTerritoire = new Map<
    ResultatChantiers<Chantier>,
    Chantier[]
  >();
  for (const { resultat, chantier } of retenues) {
    chantiersParTerritoire.set(resultat, [
      ...(chantiersParTerritoire.get(resultat) ?? []),
      chantier,
    ]);
  }
  if (!tronque) {
    for (const resultat of sortie.resultats) {
      if (!chantiersParTerritoire.has(resultat)) {
        chantiersParTerritoire.set(resultat, []);
      }
    }
  }

  return {
    ...sortie,
    resultats: [...chantiersParTerritoire].map(([resultat, chantiers]) => ({
      ...resultat,
      chantiers,
    })),
    total: lignes.length,
    ...(tronque && { tronque: true as const }),
  };
}

export function createGetChantiersTool({
  getChantiersQuery,
  territoireResolver,
}: {
  getChantiersQuery: GetChantiersQuery;
  territoireResolver: TerritoireResolver;
}) {
  return ({
    territoiresAccessibles,
    chantiersAccessibles,
  }: {
    territoiresAccessibles: string[];
    chantiersAccessibles: string[];
  }) => {
    return tool({
      description: `Renvoie les chantiers de chaque territoire du périmètre à un jalon. Pour chacun : taux d'avancement, écart à la médiane en points, tendance, niveau de confiance, s'il est en retard ou en difficulté, et sa maille de pilotage.
- \`view\`, \`tendance\` et \`chantier_ids\` se combinent.
- \`non_applicable\` : les territoires où l'analyse demandée n'a pas de sens (pas de chantiers en retard au niveau national), avec la raison ; ce n'est pas une absence de résultat.
- \`acces_refuse\` : l'utilisateur n'a accès à aucun des chantiers demandés.
- \`acces_restreint\` : territoire hors de l'accès complet de l'utilisateur ; la tendance et les personnes du territoire y sont masquées, ce n'est pas une absence de données.
- \`maille_de_pilotage\` null : la maille de pilotage du chantier n'est pas connue.
- \`taux_avancement\` null : le taux d'avancement du chantier n'est pas calculé à ce jalon, en raison d'indicateurs non renseignés ; dis-le, sans le remplacer par un autre taux.
- \`directeurs_projet\`, \`responsables_locaux\` et \`coordinateurs_territoriaux\` : les références des personnes, à recopier telles quelles pour les citer.
- \`tri\` classe les chantiers tous territoires confondus ; \`limite\` (20 par défaut) garde les premiers.
- \`total\` : le nombre de chantiers avant la limite. \`tronque\` : la liste est coupée ; dis-le (« les 20 plus en retard, sur 340 ») ou resserre la demande (vue, tendance, périmètre).
Utilise-le pour : la situation d'un ou plusieurs chantiers (CH-XXX), « quels chantiers sont en retard, en difficulté, en baisse ? », « où ça coince ? », « les chantiers les plus en retard » (tri) ; un ensemble de territoires (« la Bretagne et ses départements », « toutes les régions », « tous les départements ») : un seul appel avec le \`perimetre\` adapté.
Ne l'utilise pas pour :
- plusieurs catégories de signalement, ou une catégorie sans équivalent ici → get_chantiers_signales ;
- les valeurs des indicateurs d'un chantier → get_indicateurs ;
- les VA non à jour, les VI ou VC manquantes → get_indicateurs_a_completer ;
- les commentaires d'un chantier, synthèse des résultats comprise (freins, actions, décisions, résultats…) → get_chantier_commentaires.`,
      inputSchema: getChantiersInputSchema,
      execute: async (input): Promise<GetChantiersOutput> =>
        classerChantiers({
          sortie: retirerSynthese(
            await collecterChantiers({
              input,
              getChantiersQuery,
              territoireResolver,
              territoiresAccessibles,
              chantiersAccessibles,
            }),
          ),
          tri: input.tri,
          limite: input.limite,
        }),
    });
  };
}
