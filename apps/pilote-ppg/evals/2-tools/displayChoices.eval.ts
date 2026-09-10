import { randomUUID } from "node:crypto";
import { evalite } from "evalite";
import { AssistantIA } from "@/server/albert/AssistantIA";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { EVAL_TIMEOUT_MS, seedEvalWorld } from "../world";
import { scoreExpectedTools } from "../scoreExpectedTools";
import type { AgentTurn, ObservedToolCall } from "../types";

/**
 * Niveau 2 — `display_choices`.
 *
 * Le prompt système porte des interdits explicites sur cet outil : pas de
 * confirmation oui/non, pas de proposition de refaire un dashboard, rien à quoi
 * l'utilisateur puisse répondre en une phrase libre. Le cas négatif les couvre.
 *
 * Le monde de base sème trois chantiers logement aux intitulés proches, ce qui
 * donne au deuxième cas une ambiguïté réelle à arbitrer.
 *
 * Référence observée le 2026-09-10 : 61 %. C'est la mesure de la défaillance
 * prioritaire — Albert devine au lieu de demander.
 *
 *  - Demande sans territoire : `display_choices` 1 essai sur 3. Les deux autres,
 *    l'agent choisit un territoire à la place de l'utilisateur et appelle
 *    `get_chantiers_signales` directement. Le chiffre du POC est reproduit.
 *  - Chantier ambigu, trois candidats « logement » : `display_choices` 0 sur 3.
 *    L'agent trouve bien les candidats via `search_chantiers`, puis les liste
 *    EN TEXTE au lieu d'offrir un choix structuré.
 *  - Cas négatif : 100 %, l'interdit tient.
 *
 * Le second point est le plus net : ce n'est pas que l'agent ignore
 * l'ambiguïté, c'est qu'il la traite en prose. Même travers que sur
 * `export_rapport`, où il rédige le rapport plutôt que d'appeler l'outil.
 */

type Case = {
  question: string;
  reason: string;
  expected: ObservedToolCall[];
};

const CASES: Case[] = [
  {
    question: "Quels chantiers sont signalés en alerte ?",
    reason:
      "sous-spécifiée : aucun territoire. L'agent doit proposer un choix, pas deviner",
    expected: [{ toolName: "display_choices" }],
  },
  {
    question: "Fais-moi la synthèse du chantier sur le logement",
    reason: "trois chantiers logement dans le monde de base : ambiguïté réelle",
    expected: [
      { toolName: "search_chantiers" },
      { toolName: "display_choices" },
    ],
  },
  {
    question: "Bonjour, tu peux m'aider ?",
    reason: "CAS NÉGATIF : salutation sans intention de données, aucun outil",
    expected: [],
  },
];

evalite<Case, AgentTurn, ObservedToolCall[]>("display_choices", {
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
