import { randomUUID } from "node:crypto";
import { evalite } from "evalite";
import { AssistantIA } from "@/server/albert/AssistantIA";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { BRETAGNE, EVAL_TIMEOUT_MS, seedEvalWorld } from "../world";
import {
  seedChantierAvecTaux,
  seedChantierEnDifficulte,
  seedChantierEnRetard,
} from "../seeds";
import { scoreExpectedTools } from "../scoreExpectedTools";
import { createJudgeScorer } from "../judge";
import type { AgentTurn, ObservedToolCall } from "../types";

/**
 * Niveau 3 — scénarios `mode: "send"` de l'écran d'accueil.
 *
 * Source : src/client/components/PageAccueil/scenariosTerritoire.ts. Les
 * questions sont recopiées telles quelles, le territoire remplacé par la
 * Bretagne — le seul que ces cas peuplent.
 *
 * Trois scorers : la sélection d'outils dit si l'agent a fait le bon travail,
 * les deux juges s'il l'a rendu exploitable.
 *
 * Référence observée le 2026-09-11 : 89 %.
 *
 * Les deux premiers scénarios sortent à 85-100 % sur les trois scorers :
 * l'agent appelle les bons outils et le juge note 1/1 en citant les valeurs
 * réelles (« TA 51 % », « écart -15 points », « IND-005-53 »).
 *
 * Le scénario dashboard reste le plus variable (58-100 %), mais il mesure
 * désormais quelque chose. Deux corrections y ont mené :
 *
 *  - les chantiers semés en Bretagne n'avaient aucun indicateur, alors que ces
 *    scénarios demandent tous « et les valeurs de leurs indicateurs ». Le juge
 *    notait à juste titre les sections « Aucun indicateur disponible » comme du
 *    remplissage. Corrigé dans `seeds.ts` ;
 *  - le juge ne recevait que le texte. Or quand l'agent appelle
 *    `create_dashboard`, le contenu vit dans le RÉSULTAT DE L'OUTIL : le juge
 *    notait une phrase d'introduction et concluait « aucune donnée
 *    exploitable ». Ce 8 % ne mesurait pas Albert. Il reçoit maintenant les
 *    NOMS des outils appelés — pas leurs sorties — et juge le texte pour ce
 *    qu'il est, un accompagnement.
 */

type Case = {
  question: string;
  reason: string;
  expected: ObservedToolCall[];
};

const CASES: Case[] = [
  {
    question:
      "Analyse les chantiers en retard sur la Bretagne. Pour chaque chantier en retard, récupère également les valeurs de ses indicateurs.",
    reason: "Chantiers en retard et leurs indicateurs (DITP et coordinateur)",
    expected: [
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "get_indicateurs" },
    ],
  },
  {
    question:
      "Crée un rapport de synthèse du territoire Bretagne incluant le taux d'avancement, les chantiers en retard, les chantiers en difficulté et leurs indicateurs. Format Markdown",
    reason: "Rapport complet en Markdown (DITP admin)",
    expected: [
      { toolName: "get_taux_avancement_territoire" },
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "get_chantiers", input: { view: "en_difficulte" } },
      { toolName: "export_rapport" },
    ],
  },
  {
    question:
      "Compose un tableau de bord pour la Bretagne. Commence par une première section contenant le taux d'avancement du territoire, le nombre de chantiers en retard, le nombre de chantiers en difficulté et la cartographie du taux d'avancement.",
    reason: "Tableau de bord du territoire (DITP admin), version abrégée",
    expected: [
      { toolName: "get_taux_avancement_territoire" },
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "get_chantiers", input: { view: "en_difficulte" } },
      { toolName: "create_dashboard" },
    ],
  },
];

evalite<Case, AgentTurn, ObservedToolCall[]>("Scénarios envoyés", {
  data: () => CASES.map((cas) => ({ input: cas, expected: cas.expected })),

  task: async (input) => {
    let sortie: AgentTurn | undefined;

    await createIntegrationTest(
      async () => {
        const world = await seedEvalWorld();

        // Un territoire avec de quoi produire une vraie synthèse. Sans ça, les
        // outils renvoient vide et le juge note l'absence de données plutôt
        // que la qualité de la rédaction.
        await seedChantierAvecTaux({
          chantierId: "CH-001",
          territoire: BRETAGNE,
          taux: 62,
        });
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

  // Un juge LLM n'est pas stable non plus : deux passages montrent l'écart
  // sans tripler le coût d'un niveau déjà lent.
  trialCount: 2,

  scorers: [
    {
      name: "Outils attendus",
      description: "L'appel doit porter au moins les arguments attendus.",
      scorer: ({ output, expected }) =>
        scoreExpectedTools({ output, expected }),
    },
    createJudgeScorer<Case>({
      name: "Ancrage factuel",
      criterion:
        "La réponse s'appuie uniquement sur des données chiffrées ou des libellés qui semblent provenir de l'outillage, sans inventer de chiffre, de date ni de nom de chantier.",
    }),
    createJudgeScorer<Case>({
      name: "Utilité opérationnelle",
      criterion:
        "Un agent public qui pilote ces chantiers peut agir directement à partir de la réponse : elle est structurée, va à l'essentiel et n'enfouit pas l'information sous du remplissage.",
    }),
  ],

  columns: ({ input, output }) => [
    { label: "Scénario", value: input.reason },
    {
      label: "Outils appelés",
      value: output.toolCalls.map((call) => call.toolName).join(" → ") || "—",
    },
    { label: "Réponse", value: output.text.slice(0, 120) },
  ],
});
