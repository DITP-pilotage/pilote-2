import { randomUUID } from "node:crypto";
import { evalite } from "evalite";
import { AssistantIA } from "@/server/albert/AssistantIA";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { EVAL_TIMEOUT_MS, seedEvalWorld } from "../world";
import { scoreExpectedTools } from "../scoreExpectedTools";
import type { AgentTurn, ObservedToolCall } from "../types";

/**
 * Niveau 2 — `search_territoires`.
 *
 * Le référentiel des territoires est épargné du TRUNCATE : les cas s'appuient
 * sur les vrais codes, pas sur des fixtures.
 *
 * Les cas portent sur les déclencheurs que l'outil revendique — numéro de
 * département, regroupement géographique — et non sur des noms de région. Le
 * prompt système liste les territoires accessibles, donc l'agent résout un nom
 * comme « Bretagne » de tête, sans passer par l'outil : un cas fondé sur un nom
 * mesurerait cette résolution parasite plutôt que l'outil.
 *
 * Référence observée le 2026-09-10 : 50 %.
 *
 * CONSTAT : `search_territoires` n'est appelé sur AUCUN de ses déclencheurs,
 * 6 essais sur 6. Sur « le taux d'avancement du 29 », l'agent appelle
 * directement `get_taux_avancement_territoire` ; sur « les départements
 * bretons », directement `get_chantiers`. Seul le cas négatif — code explicite,
 * donc outil à ne PAS appeler — sort à 100 %.
 *
 * L'explication tient dans le prompt système : il liste les territoires
 * accessibles, donc le modèle n'a jamais besoin de l'outil pour résoudre un
 * nom, un numéro ou un regroupement. L'outil fait doublon avec le prompt.
 *
 * Ce 50 % n'est donc pas une faiblesse de sélection à corriger côté agent :
 * c'est la mesure d'un outil que rien ne déclenche. Deux issues possibles, à
 * arbitrer — retirer `search_territoires`, ou retirer la liste des territoires
 * du prompt pour que la résolution repasse par lui.
 *
 * Un premier jet visait « le code du département du Finistère » et « le
 * territoire où se trouve Brest » ; l'agent refusait le premier (question de
 * métadonnées hors périmètre déclaré) et résolvait le second de tête. Les cas
 * ont été réécrits sur les déclencheurs que l'outil revendique, sans changer
 * le résultat.
 */

type Case = {
  question: string;
  reason: string;
  expected: ObservedToolCall[];
};

const CASES: Case[] = [
  {
    question: "Quel est le taux d'avancement du 29 ?",
    reason:
      "numéro de département : déclencheur revendiqué par l'outil (« le 75 »)",
    expected: [
      { toolName: "search_territoires" },
      { toolName: "get_taux_avancement_territoire" },
    ],
  },
  {
    question: "Quels chantiers sont en retard dans les départements bretons ?",
    reason:
      "regroupement géographique : déclencheur revendiqué (« les départements bretons »)",
    expected: [{ toolName: "search_territoires" }],
  },
  {
    question: "Quel est le taux d'avancement de REG-53 ?",
    reason:
      "CAS NÉGATIF : code explicite fourni, le prompt interdit de rechercher",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
];

evalite<Case, AgentTurn, ObservedToolCall[]>("search_territoires", {
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
