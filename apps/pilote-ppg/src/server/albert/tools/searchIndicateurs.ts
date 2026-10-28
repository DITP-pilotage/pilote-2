import { tool } from "ai";
import { z } from "zod";
import { Albert } from "@/server/albert/Albert";
import { filtrerHallucinations } from "@/server/albert/subagents/filtrerHallucinations";
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
};

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
      description: `Renvoie au plus 10 indicateurs (identifiant IND-XXX, nom et chantier de rattachement), triés par pertinence, pour une description en langage naturel. \`chantier_ids\` restreint la recherche aux chantiers déjà identifiés.
- Plusieurs résultats plausibles : fais choisir avec clarify_with_choices avant tout appel de données ; un seul résultat clair : enchaîne.
Utilise-le pour : « le taux d'équipement », « combien de femmes formées », résoudre un indicateur avant get_indicateurs, get_evolution_indicateur, get_historique_indicateur ou get_indicateurs_non_a_jour.
Ne l'utilise pas pour : un indicateur déjà désigné par son identifiant (IND-XXX, ou un numéro seul à compléter en IND-<numéro>) → l'outil de données directement.`,
      inputSchema: searchIndicateursInputSchema,
      execute: async (
        { query, chantier_ids },
        { abortSignal },
      ): Promise<SearchIndicateursOutput> => {
        const accessibleSet = new Set(chantiersAccessibles);
        // Le LLM passe souvent `chantier_ids: []` : un tableau vide vaut « pas de filtre ».
        const filtreChantiers =
          chantier_ids !== undefined && chantier_ids.length > 0;

        const chantierIdsScope = filtreChantiers
          ? chantier_ids.filter((id) => accessibleSet.has(id))
          : chantiersAccessibles;

        if (filtreChantiers && chantierIdsScope.length === 0) {
          return {
            indicateurs: [],
            reasoning:
              "Aucun des chantiers demandés n'est accessible pour cet utilisateur.",
          };
        }

        const indicateurs = await getIndicateursIdentiteQuery.execute({
          chantierIds: chantierIdsScope,
        });

        if (indicateurs.length === 0) {
          return {
            indicateurs: [],
            reasoning: "Aucun indicateur accessible dans le périmètre demandé.",
          };
        }

        const output = await Albert.generateStructuredOutput({
          systemPrompt: buildSearchIndicateursSystemPrompt(),
          prompt: buildSubagentPrompt(query, indicateurs),
          schema: searchIndicateursSubagentOutputSchema,
          abortSignal,
        });

        const indicateursById = new Map(indicateurs.map((i) => [i.id, i]));

        const resultats = filtrerHallucinations({
          items: output.indicateurs,
          references: indicateursById,
          getId: (i) => i.id,
        }).map((i) => ({
          id: i.id,
          nom: i.nom,
          chantier: {
            id: i.chantier.id,
            nom: i.chantier.nom,
          },
        }));

        return {
          indicateurs: resultats,
          reasoning: output.reasoning,
        };
      },
    });
  };
}
