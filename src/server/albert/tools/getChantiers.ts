import { tool } from "ai";
import { z } from "zod";
import { GetChantiersQuery } from "@/server/chantiers/query/GetChantiersQuery";
import type {
  GetChantiersResult,
  GetChantiersParams,
} from "@/server/chantiers/query/GetChantiersQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";

const baseFields = {
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
};

export const getChantiersInputSchema = z.discriminatedUnion("mode", [
  z.object({
    ...baseFields,
    mode: z.literal("par_id"),
    chantier_ids: z
      .array(z.string())
      .min(1)
      .describe("Identifiants de chantiers (ex: ['CH-001', 'CH-042'])"),
  }),
  z.object({
    ...baseFields,
    mode: z.literal("par_filtre"),
    view: z
      .enum(["all", "en_retard", "en_difficulte"])
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
  }),
]);

type GetChantiersInput = z.infer<typeof getChantiersInputSchema>;

export type GetChantiersOutput = {
  resultats: GetChantiersResult[];
  _output_instructions: string;
};

function getOutputInstructions(input: GetChantiersInput): string {
  if (input.mode === "par_id") {
    return "Présente les données détaillées de chaque chantier demandé : taux d'avancement, écart, météo, tendance, et synthèse si disponible.";
  }

  if (input.view === "en_retard") {
    return "Pour chaque chantier en retard, indique l'écart par rapport à la médiane (en points) et la météo de la synthèse si disponible.";
  }

  if (input.view === "en_difficulte") {
    return "Pour chaque chantier en difficulté, indique la météo (ORAGE ou NUAGE).";
  }

  return "Présente la liste des chantiers correspondant aux critères avec leurs données clés (taux d'avancement, météo, tendance).";
}

function toQueryParams(
  input: GetChantiersInput,
  territoireCode: string,
): GetChantiersParams {
  if (input.mode === "par_id") {
    return {
      mode: "par_id",
      territoireCode,
      jalon: input.jalon,
      chantierIds: input.chantier_ids,
    };
  }

  return {
    mode: "par_filtre",
    territoireCode,
    jalon: input.jalon,
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

Deux modes :
- mode "par_id" : récupère un ou plusieurs chantiers par identifiant (CH-XXX). Utilise ce mode quand l'utilisateur mentionne un chantier par son code ou son nom.
- mode "par_filtre" : recherche des chantiers avec des critères combinables :
  - view : "all" (tous), "en_retard" (écart <= -10 pts vs médiane), "en_difficulte" (météo ORAGE/NUAGE, hors retard)
  - tendance : HAUSSE, BAISSE, STAGNATION
  - meteo : SOLEIL, COUVERT, NUAGE, ORAGE

Retourne pour chaque chantier : météo, tendance, écart, taux d'avancement, synthèse, et les flags est_en_retard / est_en_difficulte.
Quand include_sous_territoires=true, retourne aussi les chantiers de chaque sous-territoire.`,
      inputSchema: getChantiersInputSchema,
      execute: async (input): Promise<GetChantiersOutput> => {
        if (!territoiresAccessibles.includes(input.territoire_code)) {
          throw new Error(
            `Accès non autorisé au territoire ${input.territoire_code}`,
          );
        }

        const filteredInput =
          input.mode === "par_id"
            ? {
                ...input,
                chantier_ids: input.chantier_ids.filter((id) =>
                  chantiersAccessibles.includes(id),
                ),
              }
            : input;

        if (
          filteredInput.mode === "par_id" &&
          filteredInput.chantier_ids.length === 0
        ) {
          return {
            resultats: [],
            _output_instructions:
              "Aucun des chantiers demandés n'est accessible pour cet utilisateur.",
          };
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
            getChantiersQuery.execute(toQueryParams(filteredInput, code)),
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
