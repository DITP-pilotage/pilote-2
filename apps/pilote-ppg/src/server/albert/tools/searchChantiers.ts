import { tool } from "ai";
import { z } from "zod";
import { Albert } from "@/server/albert/Albert";
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
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS = `Présente à l'utilisateur la liste des chantiers identifiés au format **CH-XXX — Nom du chantier**.
Si plusieurs chantiers correspondent, demande à l'utilisateur de préciser celui qui l'intéresse avant d'appeler get_chantiers ou get_indicateurs.
Si un seul chantier correspond clairement, tu peux directement enchaîner avec l'outil de données approprié sans demander confirmation.
Si la liste est vide, indique-le et invite l'utilisateur à reformuler ou préciser sa demande. Ne reproduis pas le champ \`reasoning\` mot pour mot.`;

const OUTPUT_INSTRUCTIONS_VIDE = `Aucun chantier ne correspond à la requête. Indique-le clairement à l'utilisateur et propose-lui de reformuler ou de préciser sa demande. Mentionne, si pertinent, le motif (acronyme inconnu, thématique non couverte, etc.) sans reproduire \`reasoning\` mot pour mot.`;

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
      description: `Identifie des chantiers (CH-XXX) à partir d'une requête en langage naturel quand l'utilisateur ne connaît pas leur identifiant.

Utilise ce tool quand :
- l'utilisateur mentionne une thématique, un acronyme ou un mot-clé sans donner de CH-XXX (ex: « les chantiers sur les VSS », « chantier handicap », « sécurité routière »)
- tu as besoin de résoudre un nom de chantier vers un identifiant avant d'appeler get_chantiers, get_indicateurs ou get_chantier_commentaires

N'utilise PAS ce tool quand l'utilisateur a déjà fourni un ou plusieurs CH-XXX explicites — appelle directement get_chantiers avec \`chantier_ids\`.

Le tool retourne au maximum 10 chantiers triés par pertinence, avec leur id et leur nom uniquement. Aucune donnée d'avancement, météo ou indicateur — utilise les autres tools pour ça.`,
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
            _output_instructions: OUTPUT_INSTRUCTIONS_VIDE,
          };
        }

        const output = await Albert.generateStructuredOutput({
          systemPrompt: buildSearchChantiersSystemPrompt(),
          prompt: buildSubagentPrompt(query, chantiers),
          schema: searchChantiersSubagentOutputSchema,
          abortSignal,
        });

        const accessibleSet = new Set(chantiersAccessibles);
        const chantiersById = new Map(chantiers.map((c) => [c.id, c]));

        const resultats = output.chantiers
          .filter((c) => accessibleSet.has(c.id) && chantiersById.has(c.id))
          .map((c) => ({
            id: c.id,
            nom: chantiersById.get(c.id)?.nom ?? c.nom,
          }));

        return {
          chantiers: resultats,
          reasoning: output.reasoning,
          _output_instructions:
            resultats.length === 0
              ? OUTPUT_INSTRUCTIONS_VIDE
              : OUTPUT_INSTRUCTIONS,
        };
      },
    });
  };
}
