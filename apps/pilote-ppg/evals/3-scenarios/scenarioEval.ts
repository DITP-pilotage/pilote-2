import { randomUUID } from "node:crypto";
import { createScorer, evalite } from "evalite";
import { AssistantIA } from "@/server/albert/AssistantIA";
import { construireAgentContextTerritoire } from "@/components/PageAccueil/agentContextTerritoire";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { EVAL_TIMEOUT_MS, seedEvalWorld, type EvalProfile } from "../world";
import { scoreExpectedTools } from "../scoreExpectedTools";
import type { AgentTurn, ObservedToolCall } from "../types";
import { askJudge } from "./askJudge";
import { scenarioColumns } from "./columns";
import { extractMatter, maskedTerritories, type Evidence } from "./evidence";
import type { Criterion, Grid, JudgedCriterion } from "./grid";
import { readGroundTruth } from "./groundTruth";
import type { GroundTruth, TruthScope } from "./truth";
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
};

/**
 * Les scorers tournent APRÈS la `task`, donc après le rollback : tout ce
 * qu'ils lisent voyage dans le tour.
 */
export type ScenarioTurn = AgentTurn & {
  turnId: string;
  question: string;
  profile: EvalProfile;
  currentTerritory: string;
  toolResults: { toolName: string; input: unknown; output: unknown }[];
  userTerritories: string[];
  truth: GroundTruth;
  tableTerritories: string[];
};

export function buildEvidence({
  turn,
  grid,
}: {
  turn: ScenarioTurn;
  grid: Grid;
}): Evidence {
  const { matter, dashboard } = extractMatter({
    kind: grid.matter,
    text: turn.text,
    toolCalls: turn.toolCalls,
    toolResults: turn.toolResults,
  });

  return {
    question: turn.question,
    profile: turn.profile,
    currentTerritory: turn.currentTerritory,
    answer: turn.text,
    matter,
    dashboard,
    toolCalls: turn.toolCalls,
    toolResults: turn.toolResults.map(({ toolName, output }) => ({
      toolName,
      output,
    })),
    maskedTerritories: maskedTerritories({
      toolResults: turn.toolResults,
      userTerritories: turn.userTerritories,
    }),
    truth: turn.truth,
    tableTerritories: turn.tableTerritories,
  };
}

/**
 * Un appel de juge par tour, partagé par tous les scorers jugés. La clé est
 * l'identifiant du tour, pas l'objet : rien ne garantit qu'Evalite passe la
 * même référence à chaque scorer.
 */
const verdicts = new Map<string, Promise<Verdict>>();

function verdictFor({ turn, grid }: { turn: ScenarioTurn; grid: Grid }) {
  const cached = verdicts.get(turn.turnId);
  if (cached) return cached;

  const evidence = buildEvidence({ turn, grid });
  const criteria = grid.criteria.filter(
    (criterion): criterion is JudgedCriterion =>
      criterion.kind === "judged" && (criterion.applicable?.(evidence) ?? true),
  );
  const verdict = askJudge({ evidence, criteria });
  verdicts.set(turn.turnId, verdict);
  return verdict;
}

function criterionScorer({
  criterion,
  grid,
}: {
  criterion: Criterion;
  grid: Grid;
}) {
  return createScorer<ScenarioCase, ScenarioTurn, unknown>({
    name: criterion.id,
    description: `${criterion.kind === "judged" ? "Jugé" : "Mécanique"} — ${criterion.rule}`,
    scorer: async ({ output }) => {
      const evidence = buildEvidence({ turn: output, grid });

      // Evalite compte un score `null` comme 0 : un critère sans objet note 1,
      // et le dit sous le score pour que le rapport l'affiche « — ».
      if (criterion.applicable && !criterion.applicable(evidence)) {
        return { score: 1, metadata: "sans objet" };
      }

      if (criterion.kind === "mechanical") {
        const result = criterion.check(evidence);
        return { score: result.ok ? 1 : 0, metadata: result.detail };
      }

      const verdict = (await verdictFor({ turn: output, grid }))[criterion.id];
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
 * un scorer par critère de la grille. Une suite ne déclare que son scénario,
 * sa grille et ses cas.
 */
export function scenarioEval({
  suite,
  group,
  grid,
  cases,
  profile = "ditp",
  currentTerritory = "REG-53",
}: {
  suite: string;
  group: keyof typeof GROUPS;
  grid: Grid;
  cases: ScenarioCase[];
  profile?: EvalProfile;
  currentTerritory?: string;
}) {
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
            const world = await seedEvalWorld();
            await seedMondeTerritorial({ authorId: world.userId });
            const user = world.users[caseProfile];

            const truth = await readGroundTruth({
              scope: input.truthScope,
              user,
            });

            const result = await AssistantIA.generateText({
              chatId: randomUUID(),
              question: input.question,
              habilitations: user.habilitations,
              agentContext: construireAgentContextTerritoire({
                territoireCode: caseTerritory,
                jalon: JALON_COURANT,
              }),
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
        ...grid.criteria.map((criterion) =>
          criterionScorer({ criterion, grid }),
        ),
      ],

      columns: ({ input, output }) =>
        scenarioColumns({
          reason: input.reason,
          profile: input.profile ?? profile,
          question: input.question,
          toolCalls: output.toolCalls,
          toolResults: output.toolResults,
          text: output.text,
          withWidgets: grid.matter === "dashboard",
        }),
    },
  );
}
