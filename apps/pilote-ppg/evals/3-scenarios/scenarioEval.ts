import { randomUUID } from "node:crypto";
import type { ModelMessage } from "ai";
import { createScorer, evalite } from "evalite";
import { AssistantIA } from "@/server/albert/AssistantIA";
import { construireAgentContextTerritoire } from "@/components/PageAccueil/agentContextTerritoire";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import {
  EVAL_TIMEOUT_MS,
  seedEvalWorld,
  seedWorldPerFile,
  type EvalProfile,
} from "../world";
import { scoreExpectedTools } from "../scoreExpectedTools";
import type { ObservedToolCall } from "../types";
import { askJudge } from "./askJudge";
import { scenarioColumns } from "./columns";
import type { Criterion, JudgedCriterion } from "./criterion";
import type { MatterKind } from "./evidence";
import { readGroundTruth } from "./groundTruth";
import type { TruthScope } from "./truth";
import { buildEvidence, type PreviousTurn, type ScenarioTurn } from "./turn";
import type { Verdict } from "./judge";
import { seedMondeTerritorial } from "./mondeTerritorial";
import { JALON_COURANT } from "./territoires";

/**
 * Evalite trie les suites par ordre alphabétique du nom et ne sait pas les
 * grouper : le préfixe range par niveau, puis dans l'ordre des groupes de
 * l'écran d'accueil.
 */
export const GROUPS = {
  synthese: "3.1 · Synthèse",
  comparaison: "3.2 · Comparaison",
};

export type ScenarioCase = {
  /** Le message tel qu'il part, trou complété pour un scénario à compléter. */
  question: string;
  /** Comment le trou a été complété, ou le piège visé. */
  reason: string;
  profile?: EvalProfile;
  /** Code du territoire courant de l'accueil. */
  currentTerritory?: string;
  truthScope: TruthScope;
  expected?: ObservedToolCall[];
  forbidden?: string[];
  /** Codes des territoires que le tableau comparatif doit contenir. */
  tableTerritories?: string[];
  /**
   * Messages envoyés avant `question`, dans l'ordre, chacun suivi de la
   * réponse de l'agent. Seul le dernier tour est noté.
   */
  history?: string[];
};

/**
 * Un appel de juge par tour, partagé par tous les scorers jugés. La clé est
 * l'identifiant du tour, pas l'objet : rien ne garantit qu'Evalite passe la
 * même référence à chaque scorer.
 */
const verdicts = new Map<string, Promise<Verdict>>();

type Notation = { criteria: Criterion[]; matter: MatterKind };

function verdictFor({
  turn,
  notation,
}: {
  turn: ScenarioTurn;
  notation: Notation;
}) {
  const cached = verdicts.get(turn.turnId);
  if (cached) return cached;

  const evidence = buildEvidence({ turn, matter: notation.matter });
  const criteria = notation.criteria.filter(
    (criterion): criterion is JudgedCriterion =>
      criterion.kind === "judged" && (criterion.applicable?.(evidence) ?? true),
  );
  const verdict = askJudge({ evidence, criteria });
  verdicts.set(turn.turnId, verdict);
  return verdict;
}

function criterionScorer({
  criterion,
  notation,
}: {
  criterion: Criterion;
  notation: Notation;
}) {
  return createScorer<ScenarioCase, ScenarioTurn, unknown>({
    name: criterion.id,
    description: `${criterion.kind === "judged" ? "Jugé" : "Mécanique"} — ${criterion.rule}`,
    scorer: async ({ output }) => {
      const evidence = buildEvidence({
        turn: output,
        matter: notation.matter,
      });

      // Evalite compte un score `null` comme 0 : un critère sans objet note 1,
      // et le dit sous le score pour que le rapport l'affiche « — ».
      if (criterion.applicable && !criterion.applicable(evidence)) {
        return { score: 1, metadata: "sans objet" };
      }

      if (criterion.kind === "mechanical") {
        const result = criterion.check(evidence);
        return { score: result.ok ? 1 : 0, metadata: result.detail };
      }

      const verdict = (await verdictFor({ turn: output, notation }))[
        criterion.id
      ];
      return {
        score: verdict?.conforme ? 1 : 0,
        metadata: verdict?.preuve ?? "absent du verdict",
      };
    },
  });
}

/**
 * Tout ce qu'une suite de niveau 3 partage : le monde territorial, le tour
 * d'agent avec le profil et le contexte de l'accueil, la fiche de vérité, et
 * un scorer par critère. Une suite ne déclare que son scénario, ses critères
 * et ses cas.
 */
export function scenarioEval({
  suite,
  group,
  criteria,
  matter = "text",
  cases,
  profile = "ditp",
  currentTerritory = "REG-53",
}: {
  suite: string;
  group: keyof typeof GROUPS;
  /** Le socle et les critères du scénario, depuis son `.criteria.ts`. */
  criteria: Criterion[];
  /** Ce que le juge lit : la réponse, le rapport exporté ou le dashboard. */
  matter?: MatterKind;
  cases: ScenarioCase[];
  profile?: EvalProfile;
  currentTerritory?: string;
}) {
  const world = seedWorldPerFile(async () => {
    const seeded = await seedEvalWorld();
    await seedMondeTerritorial({ authorId: seeded.userId });
    return seeded;
  });

  evalite<ScenarioCase, ScenarioTurn, ObservedToolCall[] | undefined>(
    `${GROUPS[group]} · ${suite}`,
    {
      data: () =>
        cases.map((testCase) => ({
          input: testCase,
          expected: testCase.expected,
        })),

      task: async (input) => {
        let turn: ScenarioTurn | undefined;
        const caseProfile = input.profile ?? profile;
        const caseTerritory = input.currentTerritory ?? currentTerritory;

        await createIntegrationTest(
          async () => {
            const user = world().users[caseProfile];

            const truth = await readGroundTruth({
              scope: input.truthScope,
              user,
            });

            const chatId = randomUUID();
            const agentContext = construireAgentContextTerritoire({
              territoireCode: caseTerritory,
              jalon: JALON_COURANT,
            });
            const messages: ModelMessage[] = [];
            const history: PreviousTurn[] = [];

            for (const question of input.history ?? []) {
              const previous = await AssistantIA.generateText({
                chatId,
                question,
                history: messages,
                habilitations: user.habilitations,
                agentContext,
                userId: user.userId,
              });
              messages.push(
                { role: "user", content: question },
                ...previous.response.messages,
              );
              history.push({
                question,
                text: previous.text,
                toolResults: previous.steps.flatMap((step) =>
                  step.toolResults.map((toolResult) => ({
                    toolName: toolResult.toolName,
                    input: toolResult.input,
                    output: toolResult.output,
                  })),
                ),
              });
            }

            const result = await AssistantIA.generateText({
              chatId,
              question: input.question,
              history: messages,
              habilitations: user.habilitations,
              agentContext,
              userId: user.userId,
            });

            turn = {
              turnId: randomUUID(),
              question: input.question,
              profile: caseProfile,
              currentTerritory: caseTerritory,
              toolCalls: result.steps.flatMap((step) =>
                step.toolCalls.map((call) => ({
                  toolName: call.toolName,
                  input: call.input,
                })),
              ),
              toolResults: result.steps.flatMap((step) =>
                step.toolResults.map((toolResult) => ({
                  toolName: toolResult.toolName,
                  input: toolResult.input,
                  output: toolResult.output,
                })),
              ),
              text: result.text,
              stepCount: result.steps.length,
              userTerritories: user.habilitations.lecture.territoires,
              truth,
              tableTerritories: input.tableTerritories ?? [],
              history,
            };
          },
          { timeout: EVAL_TIMEOUT_MS },
        )();

        return turn!;
      },

      // Ni l'agent ni le juge ne sont stables d'un tour à l'autre : trois
      // essais, lus en x/3 comme au niveau 2.
      trialCount: 3,

      scorers: [
        {
          name: "Outils attendus",
          description:
            "L'appel doit porter au moins les arguments attendus, et aucun outil interdit ne doit être appelé.",
          scorer: ({ input, output, expected }) =>
            scoreExpectedTools({
              output,
              expected,
              forbidden: input.forbidden,
            }),
        },
        ...criteria.map((criterion) =>
          criterionScorer({ criterion, notation: { criteria, matter } }),
        ),
      ],

      columns: ({ input, output }) =>
        scenarioColumns({
          reason: input.reason,
          profile: input.profile ?? profile,
          question: [
            ...(input.history ?? []).map(
              (previous) => `(tour précédent) ${previous}`,
            ),
            input.question,
          ].join("\n"),
          toolCalls: output.toolCalls,
          toolResults: output.toolResults,
          text: output.text,
          withWidgets: matter === "dashboard",
        }),
    },
  );
}
