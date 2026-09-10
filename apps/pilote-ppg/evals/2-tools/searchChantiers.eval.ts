import { randomUUID } from "node:crypto";
import { evalite } from "evalite";
import { AssistantIA } from "@/server/albert/AssistantIA";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { EVAL_TIMEOUT_MS, seedEvalWorld } from "../world";
import { scoreExpectedTools } from "../scoreExpectedTools";
import type { AgentTurn, ObservedToolCall } from "../types";

/**
 * Niveau 2 — `search_chantiers`.
 *
 * `seedEvalWorld` sème vingt chantiers groupés par thème et volontairement
 * proches : trois sur les violences faites aux femmes, trois sur la santé,
 * trois sur le logement, deux sur le handicap. C'est ce qui rend la recherche
 * discriminante — l'outil injecte la liste entière dans le prompt de son
 * sous-agent.
 *
 * Référence observée le 2026-09-10 : 100 % sur 9 essais. La recherche thematique discrimine bien parmi les vingt chantiers semes.
 */

type Case = {
  question: string;
  reason: string;
  expected: ObservedToolCall[];
};

const CASES: Case[] = [
  {
    question:
      "Quels sont les chantiers qui traitent des violences sexistes et sexuelles ?",
    reason: "thématique sans identifiant : passe par la recherche sémantique",
    expected: [{ toolName: "search_chantiers" }],
  },
  {
    question: "Y a-t-il un chantier sur l'accès aux soins ?",
    reason: "thématique proche de plusieurs chantiers santé du monde de base",
    expected: [{ toolName: "search_chantiers" }],
  },
  {
    question:
      "Donne-moi les indicateurs du chantier CH-004 pour la France entière",
    reason:
      "CAS NÉGATIF : identifiant déjà fourni, le prompt interdit de rechercher",
    expected: [
      { toolName: "get_indicateurs", input: { chantier_id: "CH-004" } },
    ],
  },
];

evalite<Case, AgentTurn, ObservedToolCall[]>("search_chantiers", {
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
