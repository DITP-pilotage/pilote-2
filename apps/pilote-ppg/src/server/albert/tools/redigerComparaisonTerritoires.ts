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
import {
  descriptionPerimetre,
  variantesPerimetre,
} from "@/server/albert/tools/perimetre";

export const redigerComparaisonTerritoiresInputSchema = z.object({
  perimetre: z
    .discriminatedUnion("type", [
      variantesPerimetre.SELECTION.extend({
        territoire_codes: z
          .array(z.string())
          .min(2)
          .describe(
            "Les territoires comparés, au moins 2 (ex: ['DEPT-59', 'DEPT-33'])",
          ),
      }),
      variantesPerimetre.REGION_ET_SES_DEPARTEMENTS,
      variantesPerimetre.FRANCE_ET_SES_REGIONS,
    ])
    .describe(
      descriptionPerimetre({
        types: [
          "SELECTION",
          "REGION_ET_SES_DEPARTEMENTS",
          "FRANCE_ET_SES_REGIONS",
        ],
      }),
    ),
  jalon: jalonEncartSchema,
});

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
Utilise-le pour : une comparaison générique de territoires. Par exemple « Compare le Nord et la Gironde », « Compare la Bretagne et la Normandie » (SELECTION) ; « Compare la Bretagne avec ses départements », « Fais-moi la synthèse de la Bretagne et ses départements » (REGION_ET_SES_DEPARTEMENTS) ; « Compare la France et ses régions » (FRANCE_ET_SES_REGIONS).
Ne l'utilise pas pour :
- une demande qui nomme son critère (« compare les taux d'avancement », « les chantiers en retard ») → les outils de données ;
- le taux d'avancement nommé, un classement ou « qui avance le mieux » (« compare le taux d'avancement de la Bretagne et de la Normandie », « classe les régions », « Bretagne ou Normandie, qui avance le mieux ? ») ou une comparaison de jalons → get_taux_avancement_territoire ;
- « Où en sont l'Occitanie et ses départements ? » → get_taux_avancement_territoire avec REGION_ET_SES_DEPARTEMENTS ;
- un chantier ou un indicateur précis → les outils de données ;
- un seul territoire → rediger_synthese_territoire ;
- un graphique → create_dashboard.
Un rapport ou un téléchargement de la synthèse passe aussi par cet outil : l'encart se copie ou se télécharge en PDF depuis son bouton « Exporter ». Il collecte ses données lui-même : n'appelle pas en plus les outils de données pour la même demande.
L'interface affiche l'encart : écris ensuite une seule phrase, sans répéter son contenu ni décrire ses boutons.`,
      inputSchema: redigerComparaisonTerritoiresInputSchema,
      execute: async function* (
        { perimetre, jalon },
        { abortSignal },
      ): AsyncGenerator<EncartOutput> {
        const donnees = await collecterDonneesEncart({
          getChantiersQuery,
          territoireResolver,
          getTerritoiresIdentiteQuery,
          perimetre,
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
