import { randomUUID } from "node:crypto";
import { evalite } from "evalite";
import { AssistantIA } from "@/server/albert/AssistantIA";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { EVAL_TIMEOUT_MS, seedEvalWorld } from "../world";
import { scoreExpectedTools } from "../scoreExpectedTools";
import type { AgentTurn, ObservedToolCall } from "../types";

/**
 * Niveau 2 — `get_chantier_commentaires`.
 *
 * Pas de fixtures de cas : `CH-001`, `CH-004` et `CH-007` portent un
 * commentaire posé par le monde de base.
 *
 * Le cas négatif nomme un territoire : sans lui, l'agent demande une précision
 * — légitimement, `get_indicateurs` en a besoin — et le cas mesure alors la
 * clarification au lieu de la discrimination entre commentaires et
 * indicateurs. Premier jet à 67 % pour cette raison.
 *
 * Référence observée le 2026-09-10 : 100 % isolement, 89 % dans un run enchaine — un essai ou l agent demande une precision au lieu d appeler l outil. Variabilite du modele, pas une regression.
 */

type Case = {
  question: string;
  reason: string;
  expected: ObservedToolCall[];
};

const CASES: Case[] = [
  {
    question: "Quels sont les commentaires les plus récents sur le CH-004 ?",
    reason: "accès aux commentaires par identifiant",
    expected: [
      {
        toolName: "get_chantier_commentaires",
        input: { chantier_id: "CH-004" },
      },
    ],
  },
  {
    question:
      "Quelles difficultés sont remontées dans les commentaires du CH-001 ?",
    reason: "formulation métier : « difficultés remontées » = commentaires",
    expected: [
      {
        toolName: "get_chantier_commentaires",
        input: { chantier_id: "CH-001" },
      },
    ],
  },
  {
    question:
      "Donne-moi les indicateurs du chantier CH-001 pour la France entière",
    reason: "CAS NÉGATIF : les indicateurs relèvent de get_indicateurs",
    expected: [
      { toolName: "get_indicateurs", input: { chantier_id: "CH-001" } },
    ],
  },
];

evalite<Case, AgentTurn, ObservedToolCall[]>("get_chantier_commentaires", {
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
