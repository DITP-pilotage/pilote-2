import { randomUUID } from "node:crypto";
import { evalite } from "evalite";
import { AssistantIA } from "@/server/albert/AssistantIA";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { BRETAGNE, EVAL_TIMEOUT_MS, seedEvalWorld } from "../world";
import { seedChantierEnDifficulte, seedChantierEnRetard } from "../seeds";
import { scoreExpectedTools } from "../scoreExpectedTools";
import type { AgentTurn, ObservedToolCall } from "../types";

/**
 * Niveau 2 — `export_rapport`.
 *
 * Même dépendance au détecteur d'intention que `create_dashboard` : l'outil
 * n'existe dans le ToolSet que si l'intention d'export est repérée.
 *
 * Référence observée le 2026-09-10 : 67 %.
 *
 * CONSTAT : l'agent rédige le rapport DANS LE CHAT au lieu d'appeler l'outil
 * d'export. Sur la demande explicite de rapport Markdown, il récupère bien les
 * données puis répond « # Synthèse pour… » sans jamais appeler
 * `export_rapport` — 3 essais sur 3. Sur « télécharger un PDF », l'outil n'est
 * appelé qu'une fois sur trois.
 *
 * L'utilisateur qui demande un fichier n'en obtient donc pas. Même travers que
 * sur `display_choices` : le texte l'emporte sur l'outil structuré.
 *
 * Le cas négatif tient à 100 % : une demande de synthèse simple ne déclenche
 * pas d'export.
 */

type Case = {
  question: string;
  reason: string;
  expected: ObservedToolCall[];
};

const CASES: Case[] = [
  {
    question:
      "Crée un rapport de synthèse de la Bretagne incluant le taux d'avancement et les chantiers en retard. Format Markdown",
    reason: "demande d'export explicite, reprise du scénario de l'interface",
    expected: [
      { toolName: "get_taux_avancement_territoire" },
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "export_rapport" },
    ],
  },
  {
    question: "Je voudrais télécharger un PDF de la situation de la Bretagne",
    reason: "« télécharger » et « pdf » sont des mots-clés export",
    expected: [{ toolName: "export_rapport" }],
  },
  {
    question: "Fais-moi la synthèse de la Bretagne",
    reason: "CAS NÉGATIF : synthèse dans le chat, pas d'export de fichier",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
];

evalite<Case, AgentTurn, ObservedToolCall[]>("export_rapport", {
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
