import { tool } from "ai";
import { z } from "zod";
import { GetChantiersQuery } from "@/server/chantiers/query/GetChantiersQuery";
import type {
  ChantierResult,
  GetChantiersResult,
  GetChantiersParams,
} from "@/server/chantiers/query/GetChantiersQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import {
  libelleNiveauDeConfiance,
  libelleTendance,
  mailleDePilotage,
} from "@/server/albert/tools/libelles";

export const getChantiersInputSchema = z.object({
  territoire_code: z
    .string()
    .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
  jalon: z
    .number()
    .int()
    .min(2022)
    .max(new Date().getFullYear())
    .describe("Année du jalon (ex: 2024, 2025)"),
  include_sous_territoires: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "`true` pour un territoire ET ses sous-territoires : un seul appel sur le parent, jamais un appel par sous-territoire.",
    ),
  chantier_ids: z
    .array(z.string())
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
});

type GetChantiersInput = z.infer<typeof getChantiersInputSchema>;

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
  commentaires: ChantierResult["commentaires"];
};

export type ResultatChantiers = Omit<GetChantiersResult, "chantiers"> & {
  chantiers: ChantierRenvoye[];
};

export type GetChantiersOutput = {
  resultats: ResultatChantiers[];
  non_applicable?: { raison: string };
  acces_refuse?: true;
};

const NON_APPLICABLE_EN_RETARD_NAT_FR =
  "L'analyse des chantiers en retard ne peut pas être réalisée au niveau national.\n\nEn effet, cet indicateur repose sur une comparaison entre le taux d'avancement d'un chantier pour un territoire donné et la valeur médiane observée sur l'ensemble des autres territoires.";

function toQueryParams(
  input: GetChantiersInput,
  territoireCode: string,
): GetChantiersParams {
  return {
    territoireCode,
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
          commentaire: chantierResult.synthese.commentaire,
          date_commentaire: chantierResult.synthese.date_commentaire,
        }
      : null,
    commentaires: chantierResult.commentaires,
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
      chantiers: resultat.chantiers.map((chantier) => ({
        ...chantier,
        tendance: null,
        est_en_retard: false,
        est_en_difficulte: false,
        synthese: chantier.synthese
          ? { commentaire: null, date_commentaire: null }
          : null,
        commentaires: { donnees: null, autresResultats: null },
      })),
    };
  });
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
      description: `Renvoie les chantiers d'un territoire à un jalon. Pour chacun : taux d'avancement, écart à la médiane en points, tendance, niveau de confiance, s'il est en retard ou en difficulté, maille de pilotage, commentaire de synthèse et commentaires du territoire.
- \`view\`, \`tendance\` et \`chantier_ids\` se combinent.
- \`non_applicable.raison\` : l'analyse demandée n'a pas de sens sur ce périmètre (pas de chantiers en retard au niveau national) ; ce n'est pas une absence de résultat.
- \`acces_refuse\` : l'utilisateur n'a accès à aucun des chantiers demandés.
- \`maille_de_pilotage\` null : la maille de pilotage du chantier n'est pas connue.
Utilise-le pour : la situation d'un ou plusieurs chantiers (CH-XXX), « quels chantiers sont en retard, en difficulté, en baisse ? », « où ça coince ? » ; un territoire et ses sous-territoires : un seul appel sur le parent avec \`include_sous_territoires\`.
Ne l'utilise pas pour :
- plusieurs catégories de signalement, ou une catégorie sans équivalent ici → get_chantiers_signales ;
- les valeurs des indicateurs d'un chantier → get_indicateurs ;
- la fraîcheur des données → get_indicateurs_non_a_jour.`,
      inputSchema: getChantiersInputSchema,
      execute: async (input): Promise<GetChantiersOutput> => {
        if (
          input.territoire_code === "NAT-FR" &&
          input.view === "en_retard" &&
          !input.include_sous_territoires
        ) {
          return {
            resultats: [],
            non_applicable: { raison: NON_APPLICABLE_EN_RETARD_NAT_FR },
          };
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
          return { resultats: [], acces_refuse: true };
        }

        const effectiveInput = { ...input, chantier_ids: filteredChantierIds };

        const codes = await territoireResolver.resoudre(
          input.territoire_code,
          input.include_sous_territoires,
        );

        const resultats = await Promise.all(
          codes.map((code) =>
            getChantiersQuery.execute(toQueryParams(effectiveInput, code)),
          ),
        );

        return {
          resultats: masquerDonneesNonAccessibles(
            resultats.map((resultat) => ({
              ...resultat,
              chantiers: resultat.chantiers.map(renvoyerChantier),
            })),
            territoiresAccessibles,
          ),
        };
      },
    });
  };
}
