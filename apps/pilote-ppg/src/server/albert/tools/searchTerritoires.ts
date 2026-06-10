import { tool } from "ai";
import { z } from "zod";
import { Albert } from "@/server/albert/Albert";
import { buildSearchTerritoiresSystemPrompt } from "@/server/albert/subagents/searchTerritoiresSystemPrompt";
import type {
  GetTerritoiresIdentiteQuery,
  TerritoireIdentiteResult,
} from "@/server/chantiers/query/GetTerritoiresIdentiteQuery";

export const searchTerritoiresInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      "Requête utilisateur en langage naturel pour identifier des territoires (ex: « la Normandie », « le 75 », « les départements bretons », « les DOM », « France entière »). Peut contenir un numéro de département, un nom de région (ancienne ou actuelle), un gentilé ou un regroupement géographique.",
    ),
});

const searchTerritoiresSubagentOutputSchema = z.object({
  territoires: z
    .array(
      z.object({
        code: z.string(),
        nom: z.string(),
        maille: z.string(),
      }),
    )
    .max(10),
  reasoning: z.string(),
});

export type SearchTerritoiresOutput = {
  territoires: { code: string; nom: string; maille: string }[];
  reasoning: string;
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS = `Présente à l'utilisateur la liste des territoires identifiés en utilisant leur code (NAT-FR, REG-XX, DEPT-XX) et leur nom.
Si un seul territoire correspond clairement, tu peux directement enchaîner avec get_taux_avancement_territoire ou get_chantiers sans demander confirmation.
Si plusieurs territoires correspondent, demande à l'utilisateur de préciser celui qui l'intéresse avant d'enchaîner.
Si la liste est vide, indique-le et invite l'utilisateur à reformuler. Ne reproduis pas le champ \`reasoning\` mot pour mot.`;

const OUTPUT_INSTRUCTIONS_VIDE = `Aucun territoire ne correspond à la requête. Indique-le clairement à l'utilisateur et propose-lui de reformuler (avec un code REG-XX/DEPT-XX, un nom de région, ou un numéro de département). Ne reproduis pas \`reasoning\` mot pour mot.`;

function buildSubagentPrompt(
  query: string,
  territoires: TerritoireIdentiteResult[],
): string {
  return `${query}

<territoires>
${JSON.stringify(territoires)}
</territoires>`;
}

export function createSearchTerritoiresTool({
  getTerritoiresIdentiteQuery,
}: {
  getTerritoiresIdentiteQuery: GetTerritoiresIdentiteQuery;
}) {
  return () =>
    tool({
      description: `Identifie des territoires (NAT-FR, REG-XX, DEPT-XX) à partir d'une requête en langage naturel quand l'utilisateur ne donne pas leur code.

Utilise ce tool quand l'utilisateur mentionne un territoire par nom, numéro de département, ancienne région, gentilé ou regroupement géographique (ex: « la Normandie », « le 75 », « les départements bretons », « les DOM », « tous les départements de la région X »).

N'utilise PAS ce tool quand l'utilisateur a déjà fourni un code explicite (NAT-FR, REG-XX, DEPT-XX) — passe-le directement à get_taux_avancement_territoire ou get_chantiers.

Le tool retourne au maximum 10 territoires triés par pertinence, avec leur code, leur nom et leur maille. Aucune donnée d'avancement — utilise les autres tools pour ça.`,
      inputSchema: searchTerritoiresInputSchema,
      execute: async (
        { query },
        { abortSignal },
      ): Promise<SearchTerritoiresOutput> => {
        const territoires = await getTerritoiresIdentiteQuery.execute();

        const output = await Albert.generateStructuredOutput({
          systemPrompt: buildSearchTerritoiresSystemPrompt(),
          prompt: buildSubagentPrompt(query, territoires),
          schema: searchTerritoiresSubagentOutputSchema,
          abortSignal,
        });

        const territoiresByCode = new Map(territoires.map((t) => [t.code, t]));

        const resultats = output.territoires
          .filter((t) => territoiresByCode.has(t.code))
          .map((t) => {
            const referenceTerritoire = territoiresByCode.get(t.code);
            return {
              code: t.code,
              nom: referenceTerritoire?.nom ?? t.nom,
              maille: referenceTerritoire?.maille ?? t.maille,
            };
          });

        return {
          territoires: resultats,
          reasoning: output.reasoning,
          _output_instructions:
            resultats.length === 0
              ? OUTPUT_INSTRUCTIONS_VIDE
              : OUTPUT_INSTRUCTIONS,
        };
      },
    });
}
