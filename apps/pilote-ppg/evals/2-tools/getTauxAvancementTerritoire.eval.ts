import { randomUUID } from "node:crypto";
import { evalite } from "evalite";
import { AssistantIA } from "@/server/albert/AssistantIA";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { EVAL_TIMEOUT_MS, seedEvalWorld } from "../world";
import { scoreExpectedTools } from "../scoreExpectedTools";
import type { AgentTurn, ObservedToolCall } from "../types";

/**
 * Niveau 2 — `get_taux_avancement_territoire`.
 *
 * Pas de fixtures de cas : l'outil est interrogé sur des territoires du
 * référentiel, que `integrationTestSetup` épargne du TRUNCATE.
 *
 * Référence observée le 2026-09-10 : 100 % sur 12 essais. Les trois formulations territoriales et le cas negatif tiennent.
 */

type Case = {
  question: string;
  reason: string;
  expected: ObservedToolCall[];
};

const CASES: Case[] = [
  {
    question: "Quel est le taux d'avancement de la région Bretagne ?",
    reason: "question territoriale directe, territoire nommé",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
  {
    question: "Où en est la France sur l'ensemble des chantiers ?",
    reason: "« la France » doit se résoudre en NAT-FR sans clarification",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
  {
    question: "Compare les taux d'avancement de la Bretagne et de la Normandie",
    reason: "comparaison entre deux territoires, toujours le même outil",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
  {
    question: "Donne-moi les commentaires du chantier CH-004",
    reason: "CAS NÉGATIF : détail d'un chantier, pas de taux territorial",
    expected: [
      {
        toolName: "get_chantier_commentaires",
        input: { chantier_id: "CH-004" },
      },
    ],
  },
];

evalite<Case, AgentTurn, ObservedToolCall[]>("get_taux_avancement_territoire", {
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
