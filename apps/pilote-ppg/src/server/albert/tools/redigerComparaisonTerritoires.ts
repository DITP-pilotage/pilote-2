import { tool } from "ai";
import { z } from "zod";
import { buildComparaisonTerritoiresSystemPrompt } from "@/server/albert/subagents/encartSystemPrompts";
import {
  collecterDonneesEncart,
  type DependancesEncart,
  encartVersModele,
  type EncartOutput,
  jalonEncartSchema,
  redigerEncart,
} from "@/server/albert/tools/encart";
import type { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";

export const redigerComparaisonTerritoiresInputSchema = z
  .object({
    territoire_codes: z
      .array(z.string())
      .min(2)
      .max(5)
      .optional()
      .describe(
        "Les territoires comparés, de 2 à 5 (ex: ['DEPT-59', 'DEPT-33']). Sans territoire_code.",
      ),
    territoire_code: z
      .string()
      .optional()
      .describe(
        "Un territoire comparé à ses sous-territoires, avec include_sous_territoires. Sans territoire_codes.",
      ),
    include_sous_territoires: z
      .boolean()
      .optional()
      .describe(
        "`true` avec territoire_code : le territoire et ses sous-territoires, résolus par l'outil.",
      ),
    jalon: jalonEncartSchema,
  })
  .refine(
    ({ territoire_codes, territoire_code, include_sous_territoires }) =>
      territoire_codes
        ? territoire_code === undefined && !include_sous_territoires
        : territoire_code !== undefined && include_sous_territoires === true,
    {
      message:
        "Donne soit territoire_codes (2 à 5 territoires), soit territoire_code avec include_sous_territoires.",
    },
  );

export type RedigerComparaisonTerritoiresInput = z.infer<
  typeof redigerComparaisonTerritoiresInputSchema
>;

// Les génériques explicites : TypeScript n'infère pas la sortie d'un `execute`
// en générateur combiné à `toModelOutput`.
export function createRedigerComparaisonTerritoiresTool({
  getChantiersQuery,
  territoireResolver,
  getTerritoiresIdentiteQuery,
}: DependancesEncart) {
  return ({ habilitations }: { habilitations: Habilitations }) =>
    tool<
      RedigerComparaisonTerritoiresInput,
      EncartOutput,
      Record<string, never>
    >({
      description: `Rédige la comparaison de plusieurs territoires dans un encart affiché à l'utilisateur : un tableau des taux d'avancement face à la médiane, l'analyse des écarts, puis les chantiers en retard et en difficulté, communs ou propres à chaque territoire. L'outil collecte lui-même ces données.
Utilise-le pour : une comparaison générique de territoires. Par exemple « Compare le Nord et la Gironde », « Bretagne ou Normandie, qui avance le mieux ? » (territoire_codes) ; « Compare la Bretagne avec ses départements », « Fais-moi la synthèse de la Bretagne et ses départements » (territoire_code et include_sous_territoires).
Ne l'utilise pas pour :
- un critère précis (« compare le taux d'avancement de la Bretagne et de la Normandie ») ou une comparaison de jalons → get_taux_avancement_territoire ;
- « Où en sont l'Occitanie et ses départements ? » → get_taux_avancement_territoire avec include_sous_territoires ;
- un chantier ou un indicateur précis → les outils de données ;
- un seul territoire → rediger_synthese_territoire ;
- un rapport à télécharger → export_rapport ; un graphique → create_dashboard.
L'interface affiche l'encart : écris ensuite une seule phrase, sans répéter son contenu.`,
      inputSchema: redigerComparaisonTerritoiresInputSchema,
      execute: async function* (
        { territoire_codes, territoire_code, jalon },
        { abortSignal },
      ): AsyncGenerator<EncartOutput> {
        const donnees = await collecterDonneesEncart({
          getChantiersQuery,
          territoireResolver,
          getTerritoiresIdentiteQuery,
          territoireCodes: territoire_codes ?? [territoire_code as string],
          includeSousTerritoires: territoire_codes === undefined,
          jalon,
          habilitations,
        });
        yield* redigerEncart({
          type: "comparaison",
          jalon,
          systemPrompt: buildComparaisonTerritoiresSystemPrompt(),
          donnees,
          abortSignal,
        });
      },
      toModelOutput: encartVersModele,
    });
}
