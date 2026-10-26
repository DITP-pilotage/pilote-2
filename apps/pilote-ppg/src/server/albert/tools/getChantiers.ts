import { tool } from "ai";
import { z } from "zod";
import type { GetChantiersResult } from "@/server/chantiers/query/GetChantiersQuery";
import type {
  AccessScope,
  ChantiersReader,
} from "@/server/albert/services/ChantiersReader";
import { buildRestrictionWarning } from "@/server/albert/tools/restrictionWarning";

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
  meteo: z
    .enum(["SOLEIL", "COUVERT", "NUAGE", "ORAGE"])
    .optional()
    .describe("Filtre optionnel sur la météo"),
});

export type GetChantiersOutput = {
  resultats: GetChantiersResult[];
  non_applicable?: { raison: string };
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS =
  "Présente les chantiers retournés avec leurs données clés (taux d'avancement, écart à la médiane, météo, tendance) et la synthèse si disponible. Les flags `est_en_retard` et `est_en_difficulte` indiquent la catégorie de chaque chantier ; utilise les libellés utilisateur de la météo, jamais les codes internes.";

const NON_APPLICABLE_INSTRUCTIONS =
  "L'analyse demandée n'est pas applicable au périmètre interrogé. Explique-le clairement à l'utilisateur en reprenant fidèlement la raison fournie dans non_applicable.raison. Ne présente pas de liste vide ni ne conclus 'aucun chantier en retard'.";

const REQUESTED_CHANTIERS_NOT_ACCESSIBLE_INSTRUCTIONS =
  "Aucun des chantiers demandés n'est accessible pour cet utilisateur.";

export const NO_CHANTIER_ACCESSIBLE_INSTRUCTIONS =
  "L'utilisateur n'a accès à aucun chantier : aucune donnée ne peut être restituée.";

export function createGetChantiersTool({
  chantiersReader,
}: {
  chantiersReader: ChantiersReader;
}) {
  return (access: AccessScope) => {
    return tool({
      description: `Outil principal pour obtenir des données sur les chantiers (PPG). C'est l'outil à utiliser dès qu'un utilisateur mentionne un chantier (CH-XXX) ou demande des informations sur des chantiers.

Tous les filtres sont combinables :
- chantier_ids : restreint à des chantiers spécifiques (ex: ['CH-001', 'CH-042'])
- view : "all" (tous), "en_retard" (écart <= -10 pts vs médiane), "en_difficulte" (météo ORAGE/NUAGE, hors retard)
- tendance : HAUSSE, BAISSE, STAGNATION
- meteo : SOLEIL, COUVERT, NUAGE, ORAGE

Exemples : récupérer CH-001 et CH-042, chercher tous les chantiers en retard, ou encore filtrer parmi CH-001/CH-002/CH-003 ceux en baisse.

Retourne pour chaque chantier : météo, tendance, écart, taux d'avancement, synthèse, et les flags est_en_retard / est_en_difficulte.
Quand include_sous_territoires=true, retourne aussi les chantiers de chaque sous-territoire.

⚠️ Si la demande couvre un territoire ET ses sous-territoires (ex: « région X et ses départements »),
fais UN SEUL appel sur le territoire parent avec include_sous_territoires=true, plutôt que N appels
individuels sur chaque sous-territoire.`,
      inputSchema: getChantiersInputSchema,
      execute: async (input): Promise<GetChantiersOutput> => {
        const result = await chantiersReader.execute(
          {
            territoireCode: input.territoire_code,
            jalon: input.jalon,
            includeSousTerritoires: input.include_sous_territoires,
            chantierIds: input.chantier_ids,
            view: input.view,
            tendance: input.tendance,
            meteo: input.meteo,
          },
          access,
        );

        switch (result.kind) {
          case "notApplicable":
            return {
              resultats: [],
              non_applicable: { raison: result.raison },
              _output_instructions: NON_APPLICABLE_INSTRUCTIONS,
            };
          case "requestedChantiersNotAccessible":
            return {
              resultats: [],
              _output_instructions:
                REQUESTED_CHANTIERS_NOT_ACCESSIBLE_INSTRUCTIONS,
            };
          case "noChantierAccessible":
            return {
              resultats: [],
              _output_instructions: NO_CHANTIER_ACCESSIBLE_INSTRUCTIONS,
            };
          case "resultats":
            return {
              resultats: result.resultats,
              _output_instructions:
                buildRestrictionWarning(result.restrictedTerritoires) +
                OUTPUT_INSTRUCTIONS,
            };
        }
      },
    });
  };
}
