import { randomUUID } from "node:crypto";
import { evalite } from "evalite";
import { AssistantIA } from "@/server/albert/AssistantIA";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { BRETAGNE, EVAL_TIMEOUT_MS, seedEvalWorld } from "../world";
import { seedChantierEnDifficulte, seedChantierEnRetard } from "../seeds";
import { scoreExpectedTools } from "../scoreExpectedTools";
import type { AgentTurn, ObservedToolCall, ToolCase } from "../types";

/**
 * Evalite trie les suites par ordre alphabétique du nom et ne sait pas les
 * grouper : le préfixe est le seul moyen de les ranger. Le niveau, puis la
 * famille d'outils dans l'ordre d'un tour d'agent — résoudre ce dont parle
 * l'utilisateur, lire les données, les restituer.
 */
const FAMILLES = {
  recherche: "2.1 · Recherche",
  donnees: "2.2 · Données",
  rendu: "2.3 · Rendu",
};

export type FamilleOutil = keyof typeof FAMILLES;

/**
 * Tout ce qu'une suite de niveau 2 partage : le monde, le tour d'agent, le
 * scorer et les colonnes. Une suite ne déclare que son outil, sa famille et
 * ses cas.
 */
export function toolSelectionEval({
  famille,
  tool,
  cases,
}: {
  famille: FamilleOutil;
  tool: string;
  cases: ToolCase[];
}) {
  evalite<ToolCase, AgentTurn, ObservedToolCall[]>(
    `${FAMILLES[famille]} · ${tool}`,
    {
      data: () =>
        cases.map((testCase) => ({
          input: testCase,
          expected: testCase.expected,
        })),

      task: async (input) => {
        let turn: AgentTurn | undefined;

        await createIntegrationTest(
          async () => {
            const world = await seedEvalWorld();

            // Sans écart ni météo, les vues de `get_chantiers` sont vides et
            // l'agent peut légitimement enchaîner d'autres appels. Semé pour
            // toutes les suites : un cas négatif d'une suite est souvent le cas
            // positif d'une autre.
            await seedChantierEnRetard({
              chantierId: "CH-005",
              territoire: BRETAGNE,
            });
            await seedChantierEnDifficulte({
              chantierId: "CH-006",
              territoire: BRETAGNE,
            });

            const result = await AssistantIA.generateText({
              chatId: randomUUID(),
              question: input.question,
              habilitations: world.habilitations,
              agentContext: undefined,
              userId: world.userId,
            });

            turn = {
              toolCalls: result.steps.flatMap((step) =>
                step.toolCalls.map((call) => ({
                  toolName: call.toolName,
                  input: call.input,
                })),
              ),
              text: result.text,
              stepCount: result.steps.length,
            };
          },
          { timeout: EVAL_TIMEOUT_MS },
        )();

        return turn!;
      },

      // La sélection d'outils n'est pas stable d'un tour à l'autre, même à
      // température 0,2. On rejoue chaque cas pour que la moyenne soit lisible.
      trialCount: 3,

      scorers: [
        {
          name: "Outils attendus",
          description:
            "L'appel doit porter au moins les arguments attendus, et aucun outil interdit ne doit être appelé.",
          scorer: ({ input, output, expected }) =>
            scoreExpectedTools({
              output,
              expected,
              forbidden: input.forbidden,
            }),
        },
      ],

      columns: ({ input, output }) => [
        { label: "Message", value: input.question },
        { label: "Motif", value: input.reason },
        {
          label: "Outils appelés",
          value: output.toolCalls.map(decrireAppel).join("\n→ ") || "—",
        },
        // Le scorer ne juge que la sélection d'outils : un cas peut sortir à
        // 100 % alors que l'outil a renvoyé vide et que l'agent répond « aucun
        // chantier ». Cette colonne est le seul moyen de repérer ce vert-là.
        { label: "Réponse", value: output.text.slice(0, 120) },
      ],
    },
  );
}

function decrireAppel({ toolName, input }: ObservedToolCall) {
  return `${toolName}(${JSON.stringify(input ?? {})})`;
}
