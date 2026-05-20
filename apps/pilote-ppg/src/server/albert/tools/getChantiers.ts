import { tool } from "ai";
import { z } from "zod";
import { GetChantiersQuery } from "@/server/chantiers/query/GetChantiersQuery";
import type {
  GetChantiersResult,
  GetChantiersParams,
} from "@/server/chantiers/query/GetChantiersQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";

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
      "Si true, inclut les données des sous-territoires (ex: départements d'une région)",
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
  meteo: z
    .enum(["SOLEIL", "COUVERT", "NUAGE", "ORAGE"])
    .optional()
    .describe("Filtre optionnel sur la météo"),
});

type GetChantiersInput = z.infer<typeof getChantiersInputSchema>;

export type GetChantiersOutput = {
  resultats: GetChantiersResult[];
  non_applicable?: { raison: string };
  _output_instructions: string;
};

const NON_APPLICABLE_EN_RETARD_NAT_FR =
  "L'analyse des chantiers en retard ne peut pas être réalisée au niveau national.\n\nEn effet, cet indicateur repose sur une comparaison entre le taux d'avancement d'un chantier pour un territoire donné et la valeur médiane observée sur l'ensemble des autres territoires.";

function getOutputInstructions(input: GetChantiersInput): string {
  if (input.view === "en_retard") {
    return "Pour chaque chantier en retard, indique l'écart par rapport à la médiane (en points) et la météo de la synthèse si disponible.";
  }

  if (input.view === "en_difficulte") {
    return "Pour chaque chantier en difficulté, indique la météo avec son libellé utilisateur (Objectifs compromis, Appuis nécessaires), sans afficher les codes internes.";
  }

  if (input.chantier_ids && input.chantier_ids.length > 0) {
    return "Présente les données détaillées de chaque chantier demandé : taux d'avancement, écart, météo, tendance, et synthèse si disponible.";
  }

  return "Présente la liste des chantiers correspondant aux critères avec leurs données clés (taux d'avancement, météo, tendance).";
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
    meteo: input.meteo,
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
      description: `Outil principal pour obtenir des données sur les chantiers (PPG). C'est l'outil à utiliser dès qu'un utilisateur mentionne un chantier (CH-XXX) ou demande des informations sur des chantiers.

Tous les filtres sont combinables :
- chantier_ids : restreint à des chantiers spécifiques (ex: ['CH-001', 'CH-042'])
- view : "all" (tous), "en_retard" (écart <= -10 pts vs médiane), "en_difficulte" (météo ORAGE/NUAGE, hors retard)
- tendance : HAUSSE, BAISSE, STAGNATION
- meteo : SOLEIL, COUVERT, NUAGE, ORAGE

Exemples : récupérer CH-001 et CH-042, chercher tous les chantiers en retard, ou encore filtrer parmi CH-001/CH-002/CH-003 ceux en baisse.

Retourne pour chaque chantier : météo, tendance, écart, taux d'avancement, synthèse, et les flags est_en_retard / est_en_difficulte.
Quand include_sous_territoires=true, retourne aussi les chantiers de chaque sous-territoire.`,
      inputSchema: getChantiersInputSchema,
      execute: async (input): Promise<GetChantiersOutput> => {
        if (!territoiresAccessibles.includes(input.territoire_code)) {
          throw new Error(
            `Accès non autorisé au territoire ${input.territoire_code}`,
          );
        }

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

        const filteredChantierIds = input.chantier_ids?.filter((id) =>
          chantiersAccessibles.includes(id),
        );

        if (
          filteredChantierIds &&
          filteredChantierIds.length === 0 &&
          input.chantier_ids &&
          input.chantier_ids.length > 0
        ) {
          return {
            resultats: [],
            _output_instructions:
              "Aucun des chantiers demandés n'est accessible pour cet utilisateur.",
          };
        }

        const effectiveInput = { ...input, chantier_ids: filteredChantierIds };

        const codes = await territoireResolver.resoudre(
          input.territoire_code,
          input.include_sous_territoires,
        );
        const codesAccessibles = codes.filter((code) =>
          territoiresAccessibles.includes(code),
        );

        const resultats = await Promise.all(
          codesAccessibles.map((code) =>
            getChantiersQuery.execute(toQueryParams(effectiveInput, code)),
          ),
        );

        return {
          resultats,
          _output_instructions: getOutputInstructions(input),
        };
      },
    });
  };
}
