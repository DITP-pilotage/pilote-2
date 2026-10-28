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
};

const nonTrouve = (): ConsulterCentreAideOutput => ({
  trouve: false,
  reponse: "",
  sources: [],
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
    (
      page,
    ) => `<page id=${JSON.stringify(page.id)} titre=${JSON.stringify(page.titre)}>
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
      description: `Répond à une question sur le fonctionnement de PILOTE à partir des pages publiées du centre d'aide.
- \`reponse\` : la réponse du centre d'aide, à restituer sans la compléter ni poser de calcul sur les valeurs de la conversation.
- \`trouve\` false : le centre d'aide ne couvre pas la question. Dis-le en une phrase, sans répondre de mémoire ; un bouton pour contacter l'équipe PILOTE s'affiche sous ta réponse.
- Les pages utilisées s'affichent sous ta réponse.
- \`question\` doit être autonome et sans valeur chiffrée : remplace « ce taux », « cette page » par ce qu'ils désignent.
Utilise-le pour : la définition d'une notion de PILOTE (taux d'avancement, maille, PPG…), un mode de calcul, une procédure (saisie, import, export, propositions de valeur d'avancement, gestion des utilisateurs), le fonctionnement d'une page.
Ne l'utilise pas pour : les valeurs d'un chantier, d'un indicateur ou d'un territoire → les outils de données.`,
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
        };
      },
    });
}
