import { tool } from "ai";
import { z } from "zod";
import { buildSyntheseChantierSystemPrompt } from "@/server/albert/subagents/encartSystemPrompts";
import { chantierIdSchema } from "@/server/albert/tools/chantierId";
import {
  type EncartChantierOutput,
  jalonEncartSchema,
  streamerEncart,
} from "@/server/albert/tools/encart";
import {
  collecterDonneesEncartChantier,
  type DependancesEncartChantier,
  donneesChantierPourLeSousAgent,
  encartChantierVersModele,
} from "@/server/albert/tools/encartChantier";
import type { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";

export const redigerSyntheseChantierInputSchema = z.object({
  chantier_id: chantierIdSchema,
  territoire_code: z
    .string()
    .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
  jalon: jalonEncartSchema,
});

export type RedigerSyntheseChantierInput = z.infer<
  typeof redigerSyntheseChantierInputSchema
>;

// Les génériques explicites : TypeScript n'infère pas la sortie d'un `execute`
// en générateur combiné à `toModelOutput`.
export function createRedigerSyntheseChantierTool({
  getChantiersQuery,
  territoireResolver,
  getChantierIndicateursQuery,
  getChantierCommentairesQuery,
}: DependancesEncartChantier) {
  return ({ habilitations }: { habilitations: Habilitations }) =>
    tool<
      RedigerSyntheseChantierInput,
      EncartChantierOutput,
      Record<string, never>
    >({
      description: `Rédige la synthèse d'un chantier sur un territoire dans un encart affiché à l'utilisateur : son taux d'avancement et son écart à la médiane, son niveau de confiance et sa tendance, le résumé de sa synthèse des résultats, ses indicateurs et les commentaires du territoire. L'outil collecte lui-même ces données.
Utilise-le pour : une synthèse ou un état des lieux générique d'UN chantier sur UN territoire. Par exemple « Fais-moi la synthèse du chantier CH-071 sur le Morbihan », « Où en est le CH-012 dans le Nord ? », « Fais-moi la synthèse de ce chantier » (chantier courant), « Fais moi la synthèse du chantier CH-005 sur Bretagne. Quel est son écart à la médiane ? Quelles sont les principales difficultés remontées dans les commentaires ? » (l'encart contient l'écart et les commentaires).
Ne l'utilise pas pour :
- la synthèse d'un territoire, sans chantier désigné → rediger_synthese_territoire ;
- une donnée précise du chantier (« son taux d'avancement », « ses indicateurs », « ses commentaires », « ses objectifs ») → les outils de données ;
- un chantier sur plusieurs territoires, ou plusieurs chantiers → les outils de données ;
- un graphique → create_dashboard.
Un rapport ou un téléchargement de la synthèse d'un chantier passe aussi par cet outil : l'encart se copie ou se télécharge en PDF depuis son bouton « Exporter ». Il collecte ses données lui-même : n'appelle pas en plus les outils de données pour la même demande, ni rediger_synthese_territoire.
L'interface affiche l'encart : écris ensuite une seule phrase, sans répéter son contenu ni décrire ses boutons.`,
      inputSchema: redigerSyntheseChantierInputSchema,
      execute: async function* (
        { chantier_id, territoire_code, jalon },
        { abortSignal },
      ): AsyncGenerator<EncartChantierOutput> {
        const donnees = await collecterDonneesEncartChantier({
          chantierId: chantier_id,
          territoireCode: territoire_code,
          jalon,
          habilitations,
          getChantiersQuery,
          territoireResolver,
          getChantierIndicateursQuery,
          getChantierCommentairesQuery,
        });

        for await (const etat of streamerEncart({
          jalon,
          systemPrompt: buildSyntheseChantierSystemPrompt(),
          prompt:
            donnees === null
              ? ""
              : JSON.stringify(donneesChantierPourLeSousAgent(donnees)),
          accesRefuse: donnees === null,
          abortSignal,
        })) {
          yield etat.termine && donnees !== null
            ? { ...etat, type: "synthese_chantier", donnees }
            : { ...etat, type: "synthese_chantier" };
        }
      },
      toModelOutput: encartChantierVersModele,
    });
}
