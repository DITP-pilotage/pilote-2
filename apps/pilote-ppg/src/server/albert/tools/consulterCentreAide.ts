import { tool } from "ai";
import { z } from "zod";
import { Albert } from "@/server/albert/Albert";
import { filtrerHallucinations } from "@/server/albert/subagents/filtrerHallucinations";
import { buildCentreAideSelectionSystemPrompt } from "@/server/albert/subagents/centreAideSelectionSystemPrompt";
import { buildCentreAideReponseSystemPrompt } from "@/server/albert/subagents/centreAideReponseSystemPrompt";
import type {
  EntreeSommaireCentreAide,
  GetSommaireCentreAideQuery,
} from "@/server/parametrage-centre-aide/queries/GetSommaireCentreAideQuery";
import type {
  GetPagesCentreAideQuery,
  PageCentreAide,
} from "@/server/parametrage-centre-aide/queries/GetPagesCentreAideQuery";

const NOMBRE_MAX_PAGES = 3;

export const consulterCentreAideInputSchema = z.object({
  question: z
    .string()
    .min(1)
    .describe(
      "Question autonome, compréhensible sans la conversation (ex : « comment est calculé le taux d'avancement d'un indicateur »). Sans valeur chiffrée.",
    ),
});

// Pas de `max` : un sous-agent qui renvoie quatre ids ferait échouer la
// validation du schéma. On tronque après filtrage.
const selectionOutputSchema = z.object({
  ids: z.array(z.string()),
  reasoning: z.string(),
});

const reponseOutputSchema = z.object({
  trouve: z.boolean(),
  reponse: z.string(),
  sourcesIds: z.array(z.string()),
});

export type SourceCentreAide = {
  id: string;
  titre: string;
  chemin: string[];
  url: string;
};

export type ConsulterCentreAideOutput = {
  trouve: boolean;
  reponse: string;
  sources: SourceCentreAide[];
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS_TROUVE = `Restitue fidèlement \`reponse\` à l'utilisateur : ne la complète pas avec le glossaire ni avec d'autres connaissances, et n'en retire rien d'important.
Si la question porte sur une donnée affichée plus tôt dans la conversation (« ce taux », « cet indicateur »), applique la réponse à cette donnée avec les valeurs exactes reçues des outils (par exemple VI, VA et VC d'un indicateur), et détaille le calcul jusqu'au résultat. N'invente jamais une valeur : si tu ne retrouves pas une valeur dans les résultats des outils, donne la définition seule. N'appelle pas d'autre outil pour cela.
N'écris aucun lien ni URL : les pages du centre d'aide sont affichées sous ta réponse.`;

const OUTPUT_INSTRUCTIONS_NON_TROUVE = `Le centre d'aide ne couvre pas cette question. Dis-le à l'utilisateur en une phrase, sans affirmer de réponse, même partielle, et sans t'appuyer sur tes connaissances générales.
Indique que l'équipe PILOTE peut lui répondre : un bouton pour la contacter est affiché sous ta réponse. N'écris pas d'adresse mail.`;

const nonTrouve = (): ConsulterCentreAideOutput => ({
  trouve: false,
  reponse: "",
  sources: [],
  _output_instructions: OUTPUT_INSTRUCTIONS_NON_TROUVE,
});

const sansDoublon = (ids: string[]) => [...new Set(ids)];

const buildPromptSelection = (
  question: string,
  sommaire: EntreeSommaireCentreAide[],
) => `<question>${question}</question>

<sommaire>
${JSON.stringify(
  sommaire.map(({ id, titre, chemin, intertitres }) => ({
    id,
    titre,
    chemin: chemin.join(" > "),
    intertitres,
  })),
)}
</sommaire>`;

const buildPromptReponse = (
  question: string,
  pages: PageCentreAide[],
) => `<question>${question}</question>

<pages>
${pages
  .map(
    (page) => `<page id="${page.id}" titre="${page.titre}">
${page.contenuMarkdown}
</page>`,
  )
  .join("\n")}
</pages>`;

export function createConsulterCentreAideTool({
  getSommaireCentreAideQuery,
  getPagesCentreAideQuery,
}: {
  getSommaireCentreAideQuery: GetSommaireCentreAideQuery;
  getPagesCentreAideQuery: GetPagesCentreAideQuery;
}) {
  return () =>
    tool({
      description: `Répond à une question sur le fonctionnement de PILOTE à partir du centre d'aide (les pages publiées de l'aide en ligne).

Utilise ce tool quand l'utilisateur demande :
- la définition d'une notion de PILOTE (taux d'avancement, météo, jalon, maille, PPG…) ;
- comment une valeur est calculée ;
- comment faire quelque chose dans PILOTE : saisir ou importer des données, exporter, gérer les propositions de valeur d'avancement (PVA), gérer les utilisateurs ;
- comment fonctionne une page ou une fonctionnalité de PILOTE.

N'utilise PAS ce tool pour une question sur les valeurs d'un chantier, d'un indicateur ou d'un territoire : utilise les tools de données.

\`question\` doit être autonome, compréhensible sans la conversation : remplace « ce taux », « cette page » par ce qu'ils désignent (ex : « comment est calculé le taux d'avancement d'un indicateur »). N'y mets pas de valeurs chiffrées.`,
      inputSchema: consulterCentreAideInputSchema,
      execute: async (
        { question },
        { abortSignal },
      ): Promise<ConsulterCentreAideOutput> => {
        const sommaire = await getSommaireCentreAideQuery.execute();
        if (sommaire.length === 0) return nonTrouve();

        const selection = await Albert.generateStructuredOutput({
          systemPrompt: buildCentreAideSelectionSystemPrompt(),
          prompt: buildPromptSelection(question, sommaire),
          schema: selectionOutputSchema,
          abortSignal,
        });

        const idsRetenus = filtrerHallucinations({
          items: sansDoublon(selection.ids),
          references: new Map(sommaire.map((entree) => [entree.id, entree])),
          getId: (id) => id,
        })
          .slice(0, NOMBRE_MAX_PAGES)
          .map((entree) => entree.id);
        if (idsRetenus.length === 0) return nonTrouve();

        const pages = await getPagesCentreAideQuery.execute({
          ids: idsRetenus,
        });
        if (pages.length === 0) return nonTrouve();

        const reponse = await Albert.generateStructuredOutput({
          systemPrompt: buildCentreAideReponseSystemPrompt(),
          prompt: buildPromptReponse(question, pages),
          schema: reponseOutputSchema,
          abortSignal,
        });

        const sources = filtrerHallucinations({
          items: sansDoublon(reponse.sourcesIds),
          references: new Map(pages.map((page) => [page.id, page])),
          getId: (id) => id,
        }).map(({ id, titre, chemin, url }) => ({ id, titre, chemin, url }));

        if (!reponse.trouve || sources.length === 0) return nonTrouve();

        return {
          trouve: true,
          reponse: reponse.reponse,
          sources,
          _output_instructions: OUTPUT_INSTRUCTIONS_TROUVE,
        };
      },
    });
}
