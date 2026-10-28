import { tool } from "ai";
import { z } from "zod";
import { Albert } from "@/server/albert/Albert";
import { filtrerHallucinations } from "@/server/albert/subagents/filtrerHallucinations";
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
      "Requête utilisateur en langage naturel pour identifier des territoires (ex: « la Normandie », « les départements bretons », « les DOM », « France entière »). Peut contenir un nom de région (ancienne ou actuelle), un gentilé ou un regroupement géographique.",
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
};

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
      description: `Renvoie au plus 10 territoires (code, nom et maille), triés par pertinence, pour une description en langage naturel : nom, ancienne région, gentilé ou regroupement géographique.
- Plusieurs territoires dans une demande : une seule recherche qui les nomme tous.
- « La région X et ses départements » : cherche la région seule, puis un seul appel sur elle avec les sous-territoires.
Utilise-le pour : tout territoire désigné par un nom ou un regroupement, même s'il te semble connu (« la Normandie », « les DOM ») ; un numéro qui ne désigne aucun département (« le 20 »).
Ne l'utilise pas pour : un territoire déjà désigné par son code (NAT-FR, REG-XX, DEPT-XX) ou par un numéro de département (« le 84 » : DEPT-84) ou de région explicite (« la région 84 » : REG-84) → l'outil de données directement.`,
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

        const resultats = filtrerHallucinations({
          items: output.territoires,
          references: territoiresByCode,
          getId: (t) => t.code,
        }).map((t) => ({
          code: t.code,
          nom: t.nom,
          maille: t.maille,
        }));

        return {
          territoires: resultats,
          reasoning: output.reasoning,
        };
      },
    });
}
