import { evalite } from "evalite";
import { toolCallAccuracy } from "evalite/scorers";
import {
  runAgentTurn,
  type AgentTurn,
  type ObservedToolCall,
} from "./agentTurn";
import { withEvalWorld } from "./world";

/**
 * SPIKE — volet 2/3 : selection d'outils, boucle complete sur la base de dev.
 *
 * Les tools sont les vrais : memes schemas Zod, memes requetes Prisma. On mesure
 * QUELS outils l'agent choisit, pas la prose qu'il produit — c'est le signal le
 * plus actionnable sur un agent a 11 outils, et il est deterministe a scorer.
 */

type CasOutil = {
  question: string;
  motif: string;
};

const CAS: { input: CasOutil; expected: ObservedToolCall[] }[] = [
  {
    input: {
      question: "Quel est le taux d'avancement de la région Bretagne ?",
      motif: "question territoriale directe",
    },
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
  {
    input: {
      question:
        "Quels sont les chantiers qui traitent des violences sexistes et sexuelles ?",
      motif: "recherche thématique : doit passer par la recherche sémantique",
    },
    expected: [{ toolName: "search_chantiers" }],
  },
  {
    input: {
      question:
        "Donne-moi les indicateurs du chantier CH-007 pour la France entière",
      motif:
        "identifiant + territoire explicites : l'agent a tout pour appeler l'outil",
    },
    expected: [{ toolName: "get_indicateurs" }],
  },
  {
    input: {
      question: "Quels chantiers sont signalés en alerte ?",
      motif:
        "CLARIFICATION : question sous-spécifiée (aucun territoire). L'agent ne devine pas : il propose les territoires via display_choices avant d'aller chercher la donnée.",
    },
    expected: [{ toolName: "display_choices" }],
  },
  {
    input: {
      question: "Quels sont les commentaires les plus récents sur le CH-004 ?",
      motif: "accès aux commentaires par identifiant",
    },
    expected: [{ toolName: "get_chantier_commentaires" }],
  },
  {
    input: {
      question: "Bonjour, tu peux m'aider ?",
      motif:
        "PIEGE : salutation sans intention de données — aucun outil ne devrait être appelé",
    },
    expected: [],
  },
  {
    input: {
      question: "Donne-moi les objectifs du chantier CH-004",
      motif:
        "ARGUMENTS : ici on vérifie aussi que le bon identifiant est transmis",
    },
    expected: [
      { toolName: "get_chantier_objectifs", input: { chantier_id: "CH-004" } },
    ],
  },
];

evalite<CasOutil, AgentTurn, ObservedToolCall[]>("Sélection des outils", {
  data: () => CAS,
  task: async (input) =>
    withEvalWorld((world) => runAgentTurn({ question: input.question, world })),

  // Mesure du spike : sur des runs successifs du MEME dataset, le score global
  // est passe de 100 % a 68 %. La selection d'outils n'est pas stable d'un tour
  // a l'autre, meme a temperature 0,2. On rejoue donc chaque cas pour que la
  // moyenne soit lisible plutot que trompeuse.
  trialCount: 3,
  scorers: [
    {
      name: "Outils attendus",
      description:
        "toolCallAccuracy en mode flexible : l'ordre importe peu, la selection oui.",
      scorer: async ({ output, expected }) => {
        // Cas « aucun outil attendu » : toolCallAccuracy n'a rien a comparer,
        // on le traite explicitement — tout appel est une erreur.
        if (!expected || expected.length === 0) {
          return {
            score: output.toolCalls.length === 0 ? 1 : 0,
            metadata:
              output.toolCalls.length === 0
                ? "aucun outil appelé, conforme"
                : `outils appelés à tort : ${output.toolCalls.map((appel) => appel.toolName).join(", ")}`,
          };
        }

        // Sans `input` attendu, toolCallAccuracy classe le match en "nameOnly"
        // (poids 0,5) : le bon outil plafonnerait a 50 %. On ne veut penaliser
        // les arguments que sur les cas ou on exprime une attente dessus.
        const argumentsAttendus = expected.some(
          (appel) => appel.input !== undefined,
        );

        return toolCallAccuracy({
          actualCalls: output.toolCalls,
          expectedCalls: expected,
          mode: "flexible",
          weights: argumentsAttendus ? undefined : { nameOnly: 1 },
        });
      },
    },
  ],
  columns: ({ input, output, expected }) => [
    { label: "Cas", value: input.question.slice(0, 45) },
    {
      label: "Outils appelés",
      value: output.toolCalls.map((appel) => appel.toolName).join(" → ") || "—",
    },
    {
      label: "Attendu",
      value: (expected ?? []).map((appel) => appel.toolName).join(", ") || "—",
    },
    { label: "Ét.", value: String(output.stepCount) },
  ],
});
