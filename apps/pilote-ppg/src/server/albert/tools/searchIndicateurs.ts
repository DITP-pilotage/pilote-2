import { tool } from "ai";
import { z } from "zod";
import { Albert } from "@/server/albert/Albert";
import { buildSearchIndicateursSystemPrompt } from "@/server/albert/subagents/searchIndicateursSystemPrompt";
import type {
  GetIndicateursIdentiteQuery,
  IndicateurIdentiteResult,
} from "@/server/chantiers/query/GetIndicateursIdentiteQuery";

export const searchIndicateursInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      "Requête utilisateur en langage naturel pour identifier des indicateurs (ex: « le taux d'équipement », « combien de femmes formées », « les délais »).",
    ),
  chantier_ids: z
    .array(z.string())
    .optional()
    .describe(
      "Restreint la recherche aux indicateurs des chantiers spécifiés (ex: ['CH-064']). À utiliser quand l'utilisateur a déjà ciblé un ou plusieurs chantiers (via search_chantiers ou un CH-XXX explicite). Réduit le contexte et améliore la pertinence.",
    ),
});

const searchIndicateursSubagentOutputSchema = z.object({
  indicateurs: z
    .array(
      z.object({
        id: z.string(),
        nom: z.string(),
        chantier: z.object({
          id: z.string(),
          nom: z.string(),
        }),
      }),
    )
    .max(10),
  reasoning: z.string(),
});

export type SearchIndicateursOutput = {
  indicateurs: {
    id: string;
    nom: string;
    chantier: { id: string; nom: string };
  }[];
  reasoning: string;
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS = `Présente à l'utilisateur la liste des indicateurs identifiés avec leur id, leur nom, et leur chantier de rattachement au format **CH-XXX — Nom du chantier**.
Si un seul indicateur correspond clairement, tu peux directement enchaîner avec get_indicateurs sans demander confirmation.
Si plusieurs indicateurs correspondent, demande à l'utilisateur de préciser celui qui l'intéresse avant d'enchaîner.
Si la liste est vide, indique-le et invite l'utilisateur à reformuler. Ne reproduis pas le champ \`reasoning\` mot pour mot.`;

const OUTPUT_INSTRUCTIONS_VIDE = `Aucun indicateur ne correspond à la requête. Indique-le clairement à l'utilisateur et propose-lui de reformuler ou de cibler d'abord un chantier via search_chantiers. Ne reproduis pas \`reasoning\` mot pour mot.`;

function buildSubagentPrompt(
  query: string,
  indicateurs: IndicateurIdentiteResult[],
): string {
  return `${query}

<indicateurs>
${JSON.stringify(indicateurs)}
</indicateurs>`;
}

export function createSearchIndicateursTool({
  getIndicateursIdentiteQuery,
}: {
  getIndicateursIdentiteQuery: GetIndicateursIdentiteQuery;
}) {
  return ({ chantiersAccessibles }: { chantiersAccessibles: string[] }) => {
    return tool({
      description: `Identifie des indicateurs PILOTE à partir d'une requête en langage naturel quand l'utilisateur ne donne pas leur identifiant.

Utilise ce tool quand :
- l'utilisateur mentionne un indicateur par thématique, libellé approximatif ou métrique (ex: « le taux d'équipement », « combien de femmes formées », « les délais »)
- tu as besoin de résoudre un nom d'indicateur vers un identifiant avant d'appeler get_indicateurs

Si tu as déjà ciblé un ou plusieurs chantiers (via search_chantiers ou un CH-XXX explicite), passe leurs identifiants dans \`chantier_ids\` pour scoper la recherche et améliorer la pertinence.

Le tool retourne au maximum 10 indicateurs triés par pertinence, avec leur id, leur nom et leur chantier de rattachement. Aucune donnée chiffrée — utilise get_indicateurs pour ça.`,
      inputSchema: searchIndicateursInputSchema,
      execute: async (
        { query, chantier_ids },
        { abortSignal },
      ): Promise<SearchIndicateursOutput> => {
        const accessibleSet = new Set(chantiersAccessibles);

        const chantierIdsScope =
          chantier_ids !== undefined
            ? chantier_ids.filter((id) => accessibleSet.has(id))
            : chantiersAccessibles;

        const indicateurs = await getIndicateursIdentiteQuery.execute({
          chantierIds: chantierIdsScope,
        });

        if (indicateurs.length === 0) {
          const reasoning =
            chantier_ids !== undefined && chantierIdsScope.length === 0
              ? "Aucun des chantiers demandés n'est accessible pour cet utilisateur."
              : "Aucun indicateur accessible dans le périmètre demandé.";
          return {
            indicateurs: [],
            reasoning,
            _output_instructions: OUTPUT_INSTRUCTIONS_VIDE,
          };
        }

        const output = await Albert.generateStructuredOutput({
          systemPrompt: buildSearchIndicateursSystemPrompt(),
          prompt: buildSubagentPrompt(query, indicateurs),
          schema: searchIndicateursSubagentOutputSchema,
          abortSignal,
        });

        const indicateursById = new Map(indicateurs.map((i) => [i.id, i]));

        const resultats = output.indicateurs
          .map((i) => {
            const reference = indicateursById.get(i.id);
            if (!reference) return null;
            if (!accessibleSet.has(reference.chantier.id)) return null;
            return {
              id: reference.id,
              nom: reference.nom,
              chantier: {
                id: reference.chantier.id,
                nom: reference.chantier.nom,
              },
            };
          })
          .filter((i): i is NonNullable<typeof i> => i !== null);

        return {
          indicateurs: resultats,
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
