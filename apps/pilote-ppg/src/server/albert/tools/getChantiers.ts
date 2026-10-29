import { tool } from "ai";
import { z } from "zod";
import { chantierIdsSchema } from "@/server/albert/tools/chantierId";
import { GetChantiersQuery } from "@/server/chantiers/query/GetChantiersQuery";
import type {
  ChantierResult,
  GetChantiersResult,
  GetChantiersParams,
} from "@/server/chantiers/query/GetChantiersQuery";
import { texteDepuisHtml } from "@/server/albert/tools/texteDepuisHtml";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import type { Perimetre } from "@/server/albert/domain/Perimetre";
import {
  descriptionPerimetre,
  variantesPerimetre,
} from "@/server/albert/tools/perimetre";
import {
  libelleNiveauDeConfiance,
  libelleTendance,
  mailleDePilotage,
} from "@/server/albert/tools/libelles";

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
      "Vue : all (tous les chantiers), en_retard (écart ≤ -10 points à la médiane), en_difficulte (niveau de confiance « Objectifs compromis » ou « Appuis nécessaires », hors chantiers en retard)",
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

/**
 * L'entrée de la collecte, sans tri ni limite : l'encart lui passe des
 * périmètres que l'outil n'expose pas, et ne doit pas être tronqué.
 */
export type CollecteChantiersInput = Omit<
  GetChantiersInput,
  "perimetre" | "tri" | "limite"
> & {
  perimetre: Perimetre;
};

/**
 * Un chantier tel que l'outil le renvoie : des libellés, pas des codes
 * (PIL-1900, D1). Le niveau de confiance est le libellé de la météo du
 * chantier sur le territoire.
 */
export type ChantierRenvoye = {
  chantier: Omit<ChantierResult["chantier"], "mailles_applicables"> & {
    maille_de_pilotage: ReturnType<typeof mailleDePilotage>;
  };
  taux_avancement: number | null;
  ecart: number | null;
  tendance: string | null;
  niveau_de_confiance: string | null;
  est_en_retard: boolean;
  est_en_difficulte: boolean;
  synthese: {
    commentaire: string | null;
    date_commentaire: string | null;
  } | null;
};

export type ResultatChantiers = Omit<GetChantiersResult, "chantiers"> & {
  /** Territoire hors de l'accès complet : tendance et commentaire de synthèse y sont masqués. */
  acces_restreint?: true;
  chantiers: ChantierRenvoye[];
};

export type GetChantiersOutput = {
  resultats: ResultatChantiers[];
  /** Le nombre de chantiers, tous territoires confondus, avant la limite. Seulement en sortie de l'outil. */
  total?: number;
  tronque?: true;
  /** L'analyse sans objet est rattachée à son territoire : au national, elle ne masque pas les chantiers en retard des autres territoires. */
  non_applicable?: { territoire_code: string; raison: string }[];
  acces_refuse?: true;
};

const TERRITOIRE_NATIONAL = "NAT-FR";

const NON_APPLICABLE_EN_RETARD_NAT_FR =
  "L'analyse des chantiers en retard ne peut pas être réalisée au niveau national.\n\nEn effet, cet indicateur repose sur une comparaison entre le taux d'avancement d'un chantier pour un territoire donné et la valeur médiane observée sur l'ensemble des autres territoires.";

function toQueryParams(
  input: CollecteChantiersInput,
  territoireCodes: string[],
): GetChantiersParams {
  return {
    territoireCodes,
    jalon: input.jalon,
    chantierIds: input.chantier_ids,
    view: input.view,
    tendance: input.tendance,
  };
}

function renvoyerChantier(chantierResult: ChantierResult): ChantierRenvoye {
  const { mailles_applicables, ...chantier } = chantierResult.chantier;
  return {
    chantier: {
      ...chantier,
      maille_de_pilotage: mailleDePilotage({ mailles: mailles_applicables }),
    },
    taux_avancement: chantierResult.taux_avancement,
    ecart: chantierResult.ecart,
    tendance: libelleTendance({ tendance: chantierResult.tendance }),
    niveau_de_confiance: libelleNiveauDeConfiance({
      meteo: chantierResult.meteo,
    }),
    est_en_retard: chantierResult.est_en_retard,
    est_en_difficulte: chantierResult.est_en_difficulte,
    synthese: chantierResult.synthese
      ? {
          commentaire:
            chantierResult.synthese.commentaire === null
              ? null
              : texteDepuisHtml({ html: chantierResult.synthese.commentaire }),
          date_commentaire: chantierResult.synthese.date_commentaire,
        }
      : null,
  };
}

function masquerDonneesNonAccessibles(
  resultats: ResultatChantiers[],
  territoiresAccessibles: string[],
): ResultatChantiers[] {
  return resultats.map((resultat) => {
    if (territoiresAccessibles.includes(resultat.territoire_code)) {
      return resultat;
    }
    return {
      ...resultat,
      acces_restreint: true,
      chantiers: resultat.chantiers.map((chantier) => ({
        ...chantier,
        tendance: null,
        est_en_retard: false,
        est_en_difficulte: false,
        synthese: chantier.synthese
          ? { commentaire: null, date_commentaire: null }
          : null,
      })),
    };
  });
}

/**
 * La collecte de `get_chantiers`, partagée avec les outils d'encart : mêmes
 * règles d'accès, mêmes libellés.
 */
export async function collecterChantiers({
  input,
  getChantiersQuery,
  territoireResolver,
  territoiresAccessibles,
  chantiersAccessibles,
}: {
  input: CollecteChantiersInput;
  getChantiersQuery: GetChantiersQuery;
  territoireResolver: TerritoireResolver;
  territoiresAccessibles: string[];
  chantiersAccessibles: string[];
}): Promise<GetChantiersOutput> {
  const codesDuPerimetre = await territoireResolver.resoudre(input.perimetre);
  const sansObjet =
    input.view === "en_retard" &&
    codesDuPerimetre.includes(TERRITOIRE_NATIONAL);
  const codes = sansObjet
    ? codesDuPerimetre.filter((code) => code !== TERRITOIRE_NATIONAL)
    : codesDuPerimetre;
  const nonApplicable = sansObjet
    ? {
        non_applicable: [
          {
            territoire_code: TERRITOIRE_NATIONAL,
            raison: NON_APPLICABLE_EN_RETARD_NAT_FR,
          },
        ],
      }
    : {};

  if (codes.length === 0) {
    return { resultats: [], ...nonApplicable };
  }

  const chantiersDemandes =
    input.chantier_ids && input.chantier_ids.length > 0
      ? input.chantier_ids
      : undefined;

  // Une liste vide n'est pas filtrée par la query : le cas sans aucun
  // chantier accessible doit donc s'arrêter ici.
  const filteredChantierIds = (
    chantiersDemandes ?? chantiersAccessibles
  ).filter((id) => chantiersAccessibles.includes(id));

  if (filteredChantierIds.length === 0) {
    return { resultats: [], acces_refuse: true, ...nonApplicable };
  }

  const effectiveInput = { ...input, chantier_ids: filteredChantierIds };

  const resultats = await getChantiersQuery.execute(
    toQueryParams(effectiveInput, codes),
  );

  return {
    resultats: masquerDonneesNonAccessibles(
      resultats.map((resultat) => ({
        ...resultat,
        chantiers: resultat.chantiers.map(renvoyerChantier),
      })),
      territoiresAccessibles,
    ),
    ...nonApplicable,
  };
}

const CRITERES_DE_TRI: Record<
  TriChantiers,
  { valeur: (chantier: ChantierRenvoye) => number | null; sens: 1 | -1 }
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
 * En mémoire parce que l'encart partage `collecterChantiers` et ne doit être
 * ni trié ni tronqué. Le coût : TOUS_DEPARTEMENTS en vue `all` charge les
 * chantiers des 101 départements avant d'en garder `limite`. Si c'est trop
 * lent, trier et limiter en SQL : une première requête sur
 * `chantier_territoire_jalon` (qui porte l'écart et le taux), triée et
 * limitée, puis le détail des seuls chantiers retenus — les chantiers sans
 * ligne de jalon sortiraient alors de la vue `all`.
 */
export function classerChantiers({
  sortie,
  tri,
  limite,
}: {
  sortie: GetChantiersOutput;
  tri?: TriChantiers;
  limite?: number;
}): GetChantiersOutput {
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
    ResultatChantiers,
    ChantierRenvoye[]
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
      description: `Renvoie les chantiers de chaque territoire du périmètre à un jalon. Pour chacun : taux d'avancement, écart à la médiane en points, tendance, niveau de confiance, s'il est en retard ou en difficulté, maille de pilotage, et le commentaire de la synthèse des résultats.
- \`view\`, \`tendance\` et \`chantier_ids\` se combinent.
- \`non_applicable\` : les territoires où l'analyse demandée n'a pas de sens (pas de chantiers en retard au niveau national), avec la raison ; ce n'est pas une absence de résultat.
- \`acces_refuse\` : l'utilisateur n'a accès à aucun des chantiers demandés.
- \`acces_restreint\` : territoire hors de l'accès complet de l'utilisateur ; la tendance et le commentaire de synthèse y sont masqués, ce n'est pas une absence de données.
- \`maille_de_pilotage\` null : la maille de pilotage du chantier n'est pas connue.
- \`tri\` classe les chantiers tous territoires confondus ; \`limite\` (20 par défaut) garde les premiers.
- \`total\` : le nombre de chantiers avant la limite. \`tronque\` : la liste est coupée ; dis-le (« les 20 plus en retard, sur 340 ») ou resserre la demande (vue, tendance, périmètre).
Utilise-le pour : la situation d'un ou plusieurs chantiers (CH-XXX), « quels chantiers sont en retard, en difficulté, en baisse ? », « où ça coince ? », « les chantiers les plus en retard » (tri) ; un ensemble de territoires (« la Bretagne et ses départements », « toutes les régions », « tous les départements ») : un seul appel avec le \`perimetre\` adapté.
Ne l'utilise pas pour :
- plusieurs catégories de signalement, ou une catégorie sans équivalent ici → get_chantiers_signales ;
- les valeurs des indicateurs d'un chantier → get_indicateurs ;
- la fraîcheur des données → get_indicateurs_non_a_jour ;
- les commentaires d'un chantier (freins, actions, décisions, résultats…) → get_chantier_commentaires : ils ne sont pas ici.`,
      inputSchema: getChantiersInputSchema,
      execute: async (input): Promise<GetChantiersOutput> =>
        classerChantiers({
          sortie: await collecterChantiers({
            input,
            getChantiersQuery,
            territoireResolver,
            territoiresAccessibles,
            chantiersAccessibles,
          }),
          tri: input.tri,
          limite: input.limite,
        }),
    });
  };
}
