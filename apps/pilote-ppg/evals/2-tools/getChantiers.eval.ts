import { randomUUID } from "node:crypto";
import { evalite } from "evalite";
import { AssistantIA } from "@/server/albert/AssistantIA";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { BRETAGNE, EVAL_TIMEOUT_MS, seedEvalWorld } from "../world";
import { seedChantierEnDifficulte, seedChantierEnRetard } from "../seeds";
import { scoreExpectedTools } from "../scoreExpectedTools";
import type { AgentTurn, ObservedToolCall } from "../types";

/**
 * Niveau 2 — `get_chantiers`.
 *
 * Les `view` attendues viennent de la table « Comprendre les demandes
 * utilisateur » du prompt système : « en retard » → en_retard seul, « qui ont
 * besoin d'aide » → en_difficulte seul, « où ça coince » → les deux.
 *
 * Les cas visent la BRETAGNE et non le national : `get_chantiers(NAT-FR,
 * en_retard)` renvoie `non_applicable`, l'écart à la médiane supposant des
 * territoires comparables.
 *
 * Référence observée le 2026-09-10 : 100 % sur 12 essais, en 30 s.
 *
 * Les trois contrats de `view` tiennent, cas négatif compris. Les réponses
 * nomment bien le chantier semé et son écart de -15 points : la donnée circule,
 * ce n'est pas un vert obtenu sur un outil qui renverrait vide.
 *
 * Variabilité observée sans effet sur le score : l'agent passe tantôt par
 * `search_territoires` pour résoudre « Bretagne », tantôt directement par
 * `get_chantiers`.
 */

type Case = {
  question: string;
  reason: string;
  expected: ObservedToolCall[];
};

const CASES: Case[] = [
  {
    question: "Quels chantiers sont en retard en Bretagne ?",
    reason: "« en retard » → view en_retard uniquement",
    expected: [{ toolName: "get_chantiers", input: { view: "en_retard" } }],
  },
  {
    question: "Quels chantiers ont besoin d'un appui en Bretagne ?",
    reason: "« qui ont besoin d'aide » → view en_difficulte uniquement",
    expected: [{ toolName: "get_chantiers", input: { view: "en_difficulte" } }],
  },
  {
    question: "En Bretagne, où ça coince ?",
    reason: "« où ça coince » → les DEUX views, contrat explicite du prompt",
    expected: [
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "get_chantiers", input: { view: "en_difficulte" } },
    ],
  },
  {
    question: "Quel est le taux d'avancement de la Bretagne ?",
    reason: "CAS NÉGATIF : taux global, pas de liste de chantiers",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
];

evalite<Case, AgentTurn, ObservedToolCall[]>("get_chantiers", {
  data: () => CASES.map((cas) => ({ input: cas, expected: cas.expected })),

  task: async (input) => {
    let sortie: AgentTurn | undefined;

    await createIntegrationTest(
      async () => {
        const world = await seedEvalWorld();

        // Fixtures du cas : sans écart ni météo, les vues sont vides et
        // l'agent peut légitimement enchaîner d'autres appels.
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

  // La sélection d'outils n'est pas stable d'un tour à l'autre, même à
  // température 0,2. On rejoue chaque cas pour que la moyenne soit lisible.
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
    // Le scorer ne juge que la sélection d'outils : un cas peut sortir à 100 %
    // alors que l'outil a renvoyé vide et que l'agent répond « aucun chantier ».
    // Cette colonne est le seul moyen de repérer ce vert-là.
    { label: "Réponse", value: output.text.slice(0, 120) },
  ],
});
