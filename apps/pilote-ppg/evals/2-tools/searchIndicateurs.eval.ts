import { randomUUID } from "node:crypto";
import { evalite } from "evalite";
import { AssistantIA } from "@/server/albert/AssistantIA";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { EVAL_TIMEOUT_MS, seedEvalWorld } from "../world";
import { scoreExpectedTools } from "../scoreExpectedTools";
import type { AgentTurn, ObservedToolCall } from "../types";

/**
 * Niveau 2 — `search_indicateurs`.
 *
 * Le cas négatif est le plus important de la suite : le prompt système interdit
 * de rechercher quand l'identifiant du chantier est déjà fourni.
 *
 * Référence observée le 2026-09-10 : 100 % sur 9 essais.
 */

type Case = {
  question: string;
  reason: string;
  expected: ObservedToolCall[];
};

const CASES: Case[] = [
  {
    question:
      "Quel indicateur mesure la rénovation énergétique des logements ?",
    reason: "libellé d'indicateur en langage naturel, sans identifiant",
    expected: [{ toolName: "search_indicateurs" }],
  },
  {
    question: "Trouve-moi l'indicateur sur les déserts médicaux",
    reason: "thématique d'indicateur, pas de chantier nommé",
    expected: [{ toolName: "search_indicateurs" }],
  },
  {
    question:
      "Donne-moi les indicateurs du chantier CH-007 pour la France entière",
    reason:
      "CAS NÉGATIF : chantier identifié, on récupère ses indicateurs sans recherche",
    expected: [
      { toolName: "get_indicateurs", input: { chantier_id: "CH-007" } },
    ],
  },
];

evalite<Case, AgentTurn, ObservedToolCall[]>("search_indicateurs", {
  data: () => CASES.map((cas) => ({ input: cas, expected: cas.expected })),

  task: async (input) => {
    let sortie: AgentTurn | undefined;

    await createIntegrationTest(
      async () => {
        const world = await seedEvalWorld();

        const resultat = await AssistantIA.generateText({
          chatId: randomUUID(),
          question: input.question,
          habilitations: world.habilitations,
          agentContext: undefined,
          userId: world.userId,
        });

        sortie = {
          toolCalls: resultat.steps.flatMap((step) =>
            step.toolCalls.map((call) => ({
              toolName: call.toolName,
              input: call.input,
            })),
          ),
          text: resultat.text,
          stepCount: resultat.steps.length,
        };
      },
      { timeout: EVAL_TIMEOUT_MS },
    )();

    return sortie!;
  },

  trialCount: 3,

  scorers: [
    {
      name: "Outils attendus",
      description: "L'appel doit porter au moins les arguments attendus.",
      scorer: ({ output, expected }) =>
        scoreExpectedTools({ output, expected }),
    },
  ],

  columns: ({ input, output }) => [
    { label: "Motif", value: input.reason },
    {
      label: "Outils appelés",
      value: output.toolCalls.map((call) => call.toolName).join(" → ") || "—",
    },
    { label: "Réponse", value: output.text.slice(0, 120) },
  ],
});
