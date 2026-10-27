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
      "Mets `true` quand la demande couvre un territoire ET ses sous-territoires " +
        "(ex: « la région X et ses départements », « la région X et les départements qui la composent », " +
        "« détaille par département », « décomposé par sous-territoire »). " +
        "Dans ce cas, fais UN SEUL appel sur le territoire parent avec ce flag à true, " +
        "plutôt que d'énumérer chaque sous-territoire avec des appels séparés.",
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
      "Vue : all (tous les chantiers), en_retard (écart <= -10 pts par rapport à la médiane), en_difficulte (météo dégradée hors chantiers en retard)",
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
  synthese: { commentaire: string | null; date_commentaire: string | null } | null;
  commentaires: ChantierResult["commentaires"];
};

export type ResultatChantiers = Omit<GetChantiersResult, "chantiers"> & {
  chantiers: ChantierRenvoye[];
};

export type GetChantiersOutput = {
  resultats: ResultatChantiers[];
  non_applicable?: { raison: string };
  _output_instructions: string;
};

const NON_APPLICABLE_EN_RETARD_NAT_FR =
  "L'analyse des chantiers en retard ne peut pas être réalisée au niveau national.\n\nEn effet, cet indicateur repose sur une comparaison entre le taux d'avancement d'un chantier pour un territoire donné et la valeur médiane observée sur l'ensemble des autres territoires.";

function getOutputInstructions(
  input: GetChantiersInput,
  resultats: GetChantiersResult[],
  territoiresAccessibles: string[],
): string {
  let base: string;

  if (input.view === "en_retard") {
    base =
      "Pour chaque chantier en retard, indique l'écart par rapport à la médiane (en points) et la météo de la synthèse si disponible.";
  } else if (input.view === "en_difficulte") {
    base =
      "Pour chaque chantier en difficulté, indique la météo avec son libellé utilisateur (Objectifs compromis, Appuis nécessaires), sans afficher les codes internes.";
  } else if (input.chantier_ids && input.chantier_ids.length > 0) {
    base =
      "Présente les données détaillées de chaque chantier demandé : taux d'avancement, écart, météo, tendance, et synthèse si disponible.";
  } else {
    base =
      "Présente la liste des chantiers correspondant aux critères avec leurs données clés (taux d'avancement, météo, tendance).";
  }

  const codesRestreints = resultats
    .map((r) => r.territoire_code)
    .filter((code) => !territoiresAccessibles.includes(code));

  if (codesRestreints.length === 0) return base;

  return (
    `⚠️ Restriction d'accès — territoires ${codesRestreints.join(", ")} : seuls le taux d'avancement, la météo et l'écart à la médiane sont disponibles. Les champs tendance et synthèse (commentaire) sont null par restriction d'accès, et non par absence de données. Tu DOIS le mentionner explicitement dans ta réponse quand ces champs sont retournés.\n\n` +
    base
  );
}

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
      description: `Outil principal pour obtenir des données sur les chantiers (PPG). C'est l'outil à utiliser dès qu'un utilisateur mentionne un chantier (CH-XXX) ou demande des informations sur des chantiers.

Tous les filtres sont combinables :
- chantier_ids : restreint à des chantiers spécifiques (ex: ['CH-001', 'CH-042'])
- view : "all" (tous), "en_retard" (écart <= -10 pts vs médiane), "en_difficulte" (météo ORAGE/NUAGE, hors retard)
- tendance : HAUSSE, BAISSE, STAGNATION

Exemples : récupérer CH-001 et CH-042, chercher tous les chantiers en retard, ou encore filtrer parmi CH-001/CH-002/CH-003 ceux en baisse.

Retourne pour chaque chantier : météo, tendance, écart, taux d'avancement, synthèse, et les flags est_en_retard / est_en_difficulte.
Quand include_sous_territoires=true, retourne aussi les chantiers de chaque sous-territoire.

⚠️ Si la demande couvre un territoire ET ses sous-territoires (ex: « région X et ses départements »),
fais UN SEUL appel sur le territoire parent avec include_sous_territoires=true, plutôt que N appels
individuels sur chaque sous-territoire.
Cette règle s'applique aussi pour les comparaisons entre jalons : un appel par territoire parent ET
par jalon (avec include_sous_territoires=true), pas un appel par (sous-territoire × jalon). Si
plusieurs territoires parents sont comparés, fais un appel par parent et par jalon.`,
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
            _output_instructions:
              "L'analyse demandée n'est pas applicable au périmètre interrogé. Explique-le clairement à l'utilisateur en reprenant fidèlement la raison fournie dans non_applicable.raison. Ne présente pas de liste vide ni ne conclus 'aucun chantier en retard'.",
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
          return {
            resultats: [],
            _output_instructions: chantiersDemandes
              ? "Aucun des chantiers demandés n'est accessible pour cet utilisateur."
              : "L'utilisateur n'a accès à aucun chantier : aucune donnée ne peut être restituée.",
          };
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
          _output_instructions: getOutputInstructions(
            input,
            resultats,
            territoiresAccessibles,
          ),
        };
      },
    });
  };
}
