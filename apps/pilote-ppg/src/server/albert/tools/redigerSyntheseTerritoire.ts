import { tool } from "ai";
import { z } from "zod";
import { buildSyntheseTerritoireSystemPrompt } from "@/server/albert/subagents/encartSystemPrompts";
import {
  collecterDonneesEncart,
  type DependancesEncart,
  encartVersModele,
  type EncartOutput,
  jalonEncartSchema,
  redigerEncart,
} from "@/server/albert/tools/encart";
import type { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";

export const redigerSyntheseTerritoireInputSchema = z.object({
  territoire_code: z
    .string()
    .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
  jalon: jalonEncartSchema,
  avec_indicateurs: z
    .boolean()
    .optional()
    .describe(
      "`true` quand la demande cite les indicateurs des chantiers : l'encart ajoute leurs valeurs sous chaque chantier.",
    ),
});

export type RedigerSyntheseTerritoireInput = z.infer<
  typeof redigerSyntheseTerritoireInputSchema
>;

// Les génériques explicites : TypeScript n'infère pas la sortie d'un `execute`
// en générateur combiné à `toModelOutput`.
export function createRedigerSyntheseTerritoireTool({
  getChantiersQuery,
  territoireResolver,
  getTerritoiresIdentiteQuery,
  getChantierIndicateursQuery,
}: DependancesEncart) {
  return ({ habilitations }: { habilitations: Habilitations }) =>
    tool<RedigerSyntheseTerritoireInput, EncartOutput, Record<string, never>>({
      description: `Rédige la synthèse d'un territoire dans un encart affiché à l'utilisateur : son taux d'avancement face à la médiane, ses chantiers en retard et ses chantiers en difficulté, avec un résumé de leur synthèse. L'outil collecte lui-même ces données.
Utilise-le pour : une synthèse ou un état des lieux générique d'un territoire. Par exemple « Fais-moi la synthèse du Nord », « Où en est la Gironde ? », « La situation en Bretagne », « Fais-moi la synthèse des difficultés de la Bretagne », « Où en est la France sur l'ensemble des chantiers ? », « Crée un rapport de synthèse du Nord avec les indicateurs des chantiers » (avec_indicateurs).
Ne l'utilise pas pour :
- une demande qui nomme son critère (« compare les taux d'avancement », « les chantiers en retard ») → les outils de données ;
- un critère précis (« les chantiers en retard du Nord », « le taux d'avancement de la Gironde », « les difficultés en Hauts-de-France ») → get_chantiers ou get_taux_avancement_territoire ;
- un chantier ou un indicateur précis → les outils de données ;
- plusieurs territoires → rediger_comparaison_territoires ;
- un graphique → create_dashboard.
Un rapport ou un téléchargement de la synthèse passe aussi par cet outil, même quand la demande liste son contenu (taux, chantiers en retard, en difficulté) ; si elle cite les indicateurs, passe avec_indicateurs à true. Ne dis jamais que l'encart contient les indicateurs si tu ne les as pas demandés. L'encart se copie ou se télécharge en PDF depuis ses boutons. Il collecte ses données lui-même : n'appelle pas en plus les outils de données pour la même demande.
L'interface affiche l'encart : écris ensuite une seule phrase, sans répéter son contenu ; elle peut indiquer que ses boutons le copient ou le téléchargent en PDF.`,
      inputSchema: redigerSyntheseTerritoireInputSchema,
      execute: async function* (
        { territoire_code, jalon, avec_indicateurs },
        { abortSignal },
      ): AsyncGenerator<EncartOutput> {
        const donnees = await collecterDonneesEncart({
          getChantiersQuery,
          territoireResolver,
          getTerritoiresIdentiteQuery,
          getChantierIndicateursQuery,
          avecIndicateurs: avec_indicateurs,
          perimetre: { type: "SELECTION", territoire_codes: [territoire_code] },
          jalon,
          habilitations,
        });
        yield* redigerEncart({
          type: "synthese",
          jalon,
          systemPrompt: buildSyntheseTerritoireSystemPrompt(),
          donnees,
          abortSignal,
        });
      },
      toModelOutput: encartVersModele,
    });
}
