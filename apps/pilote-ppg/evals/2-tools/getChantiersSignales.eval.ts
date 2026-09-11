import { randomUUID } from "node:crypto";
import { evalite } from "evalite";
import { AssistantIA } from "@/server/albert/AssistantIA";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { BRETAGNE, EVAL_TIMEOUT_MS, seedEvalWorld } from "../world";
import { seedChantierEnDifficulte, seedChantierEnRetard } from "../seeds";
import { scoreExpectedTools } from "../scoreExpectedTools";
import type { AgentTurn, ObservedToolCall } from "../types";

/**
 * Niveau 2 — `get_chantiers_signales`.
 *
 * Le prompt système distingue deux régimes : sans précision de catégorie,
 * l'outil est appelé sans `categories` ; avec une ou plusieurs catégories
 * nommées, elles sont passées explicitement.
 *
 * Ces cas n'expriment volontairement pas d'attente sur `categories` : les
 * valeurs exactes de l'énumération n'ont pas été relevées dans le code, et un
 * cas qui n'exprime rien vaut mieux qu'un cas qui exprime une valeur fausse.
 *
 * Référence observée le 2026-09-10 : 100 % sur 12 essais, sans attente sur categories.
 */

type Case = {
  question: string;
  reason: string;
  expected: ObservedToolCall[];
};

const CASES: Case[] = [
  {
    question: "Quels sont les chantiers signalés en Bretagne ?",
    reason: "sans précision de catégorie → appel sans argument categories",
    expected: [{ toolName: "get_chantiers_signales" }],
  },
  {
    question: "En Bretagne, quels chantiers ont un taux non calculé ?",
    reason: "une seule catégorie nommée",
    expected: [{ toolName: "get_chantiers_signales" }],
  },
  {
    question:
      "En Bretagne, montre-moi les signalements de type PVA et météo non renseignée",
    reason: "deux catégories demandées ensemble",
    expected: [{ toolName: "get_chantiers_signales" }],
  },
  {
    question: "Quels chantiers sont en retard en Bretagne ?",
    reason:
      "CAS NÉGATIF : « en retard » relève de get_chantiers, pas des signalements",
    expected: [{ toolName: "get_chantiers", input: { view: "en_retard" } }],
  },
];

evalite<Case, AgentTurn, ObservedToolCall[]>("get_chantiers_signales", {
  data: () => CASES.map((cas) => ({ input: cas, expected: cas.expected })),

  task: async (input) => {
    let sortie: AgentTurn | undefined;

    await createIntegrationTest(
      async () => {
        const world = await seedEvalWorld();

        // Le cas négatif porte sur `en_retard` : sans écart ni météo, la vue
        // serait vide et l'agent pourrait légitimement enchaîner ailleurs.
        await seedChantierEnRetard({
          chantierId: "CH-005",
          territoire: BRETAGNE,
        });
        await seedChantierEnDifficulte({
          chantierId: "CH-006",
          territoire: BRETAGNE,
        });

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
