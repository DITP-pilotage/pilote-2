import { tool } from "ai";
import { z } from "zod";
import type { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import type { GetChantiersResult } from "@/server/chantiers/query/GetChantiersQuery";
import type {
  ChantiersReader,
  ReadChantiersResult,
} from "@/server/albert/services/ChantiersReader";
import type {
  TauxAvancementTerritoireReader,
  TauxAvancementTerritoireResult,
} from "@/server/albert/services/TauxAvancementTerritoireReader";
import { NO_CHANTIER_ACCESSIBLE_INSTRUCTIONS } from "@/server/albert/tools/getChantiers";
import { buildSyntheseInstructions } from "@/server/albert/tools/syntheseTerritoireTemplates";

export const syntheseTerritoireInputSchema = z.object({
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
});

export type SyntheseTerritoireOutput = {
  taux_avancement: TauxAvancementTerritoireResult[];
  chantiers_en_retard: GetChantiersResult[];
  chantiers_en_difficulte: GetChantiersResult[];
  non_applicable_en_retard?: { raison: string };
  _output_instructions: string;
};

function toResultats(result: ReadChantiersResult): GetChantiersResult[] {
  return result.kind === "resultats" ? result.resultats : [];
}

function toRestrictedTerritoires(result: ReadChantiersResult): string[] {
  return result.kind === "resultats" ? result.restrictedTerritoires : [];
}

export function createSyntheseTerritoireTool({
  chantiersReader,
  tauxAvancementTerritoireReader,
}: {
  chantiersReader: ChantiersReader;
  tauxAvancementTerritoireReader: TauxAvancementTerritoireReader;
}) {
  return ({ habilitations }: { habilitations: Habilitations }) => {
    const access = {
      territoiresAccessibles: habilitations.lecture.territoires,
      chantiersAccessibles: habilitations.lecture.chantiers,
    };

    return tool({
      description: `Produit en un seul appel toutes les données d'une synthèse territoriale : taux d'avancement global et médiane, chantiers en retard, chantiers en difficulté.

À utiliser uniquement quand l'utilisateur demande explicitement une synthèse, un état des lieux ou un résumé de la situation d'un territoire.

Ne pas l'utiliser :
- pour l'avancement global d'un territoire (« où en est X », « où en est X sur l'ensemble des chantiers », « quel est le TA de X ») : utilise get_taux_avancement_territoire ;
- pour lister, récapituler ou comparer les chantiers d'un ou plusieurs territoires, ou pour une seule catégorie (en retard, en difficulté, en baisse) : utilise get_chantiers ;
- pour un chantier précis : utilise get_chantiers avec chantier_ids.

Le résultat contient le gabarit de réponse à suivre dans _output_instructions.`,
      inputSchema: syntheseTerritoireInputSchema,
      execute: async (input): Promise<SyntheseTerritoireOutput> => {
        const perimetre = {
          territoireCode: input.territoire_code,
          jalon: input.jalon,
          includeSousTerritoires: input.include_sous_territoires,
        };

        const [tauxAvancement, enRetard, enDifficulte] = await Promise.all([
          tauxAvancementTerritoireReader.execute(perimetre, habilitations),
          chantiersReader.execute({ ...perimetre, view: "en_retard" }, access),
          chantiersReader.execute(
            { ...perimetre, view: "en_difficulte" },
            access,
          ),
        ]);

        if (enDifficulte.kind === "noChantierAccessible") {
          return {
            taux_avancement: [],
            chantiers_en_retard: [],
            chantiers_en_difficulte: [],
            _output_instructions: NO_CHANTIER_ACCESSIBLE_INSTRUCTIONS,
          };
        }

        const nonApplicableEnRetard =
          enRetard.kind === "notApplicable"
            ? { raison: enRetard.raison }
            : undefined;

        return {
          taux_avancement: tauxAvancement,
          chantiers_en_retard: toResultats(enRetard),
          chantiers_en_difficulte: toResultats(enDifficulte),
          ...(nonApplicableEnRetard
            ? { non_applicable_en_retard: nonApplicableEnRetard }
            : {}),
          _output_instructions: buildSyntheseInstructions({
            nombreTerritoires: tauxAvancement.length,
            nonApplicableEnRetard: nonApplicableEnRetard !== undefined,
            restrictedTerritoires: [
              ...new Set([
                ...toRestrictedTerritoires(enRetard),
                ...toRestrictedTerritoires(enDifficulte),
              ]),
            ],
          }),
        };
      },
    });
  };
}
