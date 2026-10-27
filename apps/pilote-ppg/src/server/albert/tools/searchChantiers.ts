import { tool } from "ai";
import { z } from "zod";
import { Albert } from "@/server/albert/Albert";
import { filtrerHallucinations } from "@/server/albert/subagents/filtrerHallucinations";
import { buildSearchChantiersSystemPrompt } from "@/server/albert/subagents/searchChantiersSystemPrompt";
import type {
  ChantierIdentiteResult,
  GetChantiersIdentiteQuery,
} from "@/server/chantiers/query/GetChantiersIdentiteQuery";

export const searchChantiersInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      "Requête utilisateur en langage naturel pour identifier des chantiers (ex: « les chantiers sur les VSS », « chantier handicap », « sécurité routière »). Peut contenir un acronyme, un mot-clé thématique, un nom de politique publique ou un ministère.",
    ),
});

const searchChantiersSubagentOutputSchema = z.object({
  chantiers: z
    .array(
      z.object({
        id: z.string(),
        nom: z.string(),
      }),
    )
    .max(10),
  reasoning: z.string(),
});

export type SearchChantiersOutput = {
  chantiers: { id: string; nom: string }[];
  reasoning: string;
};

function buildSubagentPrompt(
  query: string,
  chantiers: ChantierIdentiteResult[],
): string {
  return `${query}

<chantiers>
${JSON.stringify(chantiers)}
</chantiers>`;
}

export function createSearchChantiersTool({
  getChantiersIdentiteQuery,
}: {
  getChantiersIdentiteQuery: GetChantiersIdentiteQuery;
}) {
  return ({ chantiersAccessibles }: { chantiersAccessibles: string[] }) => {
    return tool({
      description: `Renvoie au plus 10 chantiers (identifiant et nom), triés par pertinence, pour une description en langage naturel : thème, acronyme, mot-clé, politique prioritaire, PPG ou ministère.
- Plusieurs résultats plausibles : fais choisir avec clarify_with_choices avant tout appel de données ; un seul résultat clair : enchaîne.
Utilise-le pour : « les chantiers sur les VSS », « le chantier handicap », résoudre un chantier avant un outil de données.
Ne l'utilise pas pour : un chantier déjà désigné par son identifiant CH-XXX → l'outil de données directement.`,
      inputSchema: searchChantiersInputSchema,
      execute: async (
        { query },
        { abortSignal },
      ): Promise<SearchChantiersOutput> => {
        const chantiers = await getChantiersIdentiteQuery.execute({
          chantierIds: chantiersAccessibles,
        });

        if (chantiers.length === 0) {
          return {
            chantiers: [],
            reasoning: "Aucun chantier accessible pour cet utilisateur.",
          };
        }

        const output = await Albert.generateStructuredOutput({
          systemPrompt: buildSearchChantiersSystemPrompt(),
          prompt: buildSubagentPrompt(query, chantiers),
          schema: searchChantiersSubagentOutputSchema,
          abortSignal,
        });

        const chantiersById = new Map(chantiers.map((c) => [c.id, c]));

        const resultats = filtrerHallucinations({
          items: output.chantiers,
          references: chantiersById,
          getId: (c) => c.id,
        }).map((c) => ({
          id: c.id,
          nom: c.nom,
        }));

        return {
          chantiers: resultats,
          reasoning: output.reasoning,
        };
      },
    });
  };
}
