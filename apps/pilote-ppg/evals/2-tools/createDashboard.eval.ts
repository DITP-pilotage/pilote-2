import { randomUUID } from "node:crypto";
import { evalite } from "evalite";
import { AssistantIA } from "@/server/albert/AssistantIA";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { BRETAGNE, EVAL_TIMEOUT_MS, seedEvalWorld } from "../world";
import { seedChantierEnDifficulte, seedChantierEnRetard } from "../seeds";
import { scoreExpectedTools } from "../scoreExpectedTools";
import type { AgentTurn, ObservedToolCall } from "../types";

/**
 * Niveau 2 — `create_dashboard`.
 *
 * L'outil n'est exposé que si `detecterCapacities` repère l'intention
 * dashboard : un échec ici peut venir du détecteur (niveau 1) autant que de
 * l'agent. Le cas négatif distingue les deux — s'il déclenche quand même
 * l'outil, c'est le détecteur qui sur-déclenche.
 *
 * Référence observée le 2026-09-10 : 100 % sur 9 essais.
 *
 * À rapprocher d'`export_rapport`, à 67 % sur des cas de même forme : quand la
 * demande porte sur une VISUALISATION, l'agent appelle l'outil ; quand elle
 * porte sur un FICHIER, il rédige à la place. Le détecteur d'intention expose
 * les deux outils de la même façon — la différence vient de l'agent.
 */

type Case = {
  question: string;
  reason: string;
  expected: ObservedToolCall[];
};

const CASES: Case[] = [
  {
    question:
      "Compose un tableau de bord de la Bretagne avec le taux d'avancement et les chantiers en retard",
    reason: "demande de dashboard explicite, données disponibles",
    expected: [
      { toolName: "get_taux_avancement_territoire" },
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "create_dashboard" },
    ],
  },
  {
    question: "Affiche-moi un cockpit de la Bretagne",
    reason: "« cockpit » est un synonyme dashboard du détecteur d'intention",
    expected: [{ toolName: "create_dashboard" }],
  },
  {
    question: "Quel est le taux d'avancement de la Bretagne ?",
    reason:
      "CAS NÉGATIF : question factuelle, aucune intention de visualisation",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
];

evalite<Case, AgentTurn, ObservedToolCall[]>("create_dashboard", {
  data: () => CASES.map((cas) => ({ input: cas, expected: cas.expected })),

  task: async (input) => {
    let sortie: AgentTurn | undefined;

    await createIntegrationTest(
      async () => {
        const world = await seedEvalWorld();

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
