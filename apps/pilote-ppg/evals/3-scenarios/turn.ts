import type { AgentTurn } from "../types";
import type { EvalProfile } from "../world";
import {
  extractMatter,
  maskedTerritories,
  type Evidence,
  type MatterKind,
} from "./evidence";
import type { GroundTruth } from "./truth";

type ToolResult = { toolName: string; input: unknown; output: unknown };

/** Un tour joué avant la demande jugée, pour un scénario en plusieurs tours. */
export type PreviousTurn = {
  question: string;
  text: string;
  toolResults: ToolResult[];
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
  toolResults: ToolResult[];
  userTerritories: string[];
  truth: GroundTruth;
  tableTerritories: string[];
  /** Les tours qui précèdent, dans l'ordre ; vide pour un tour isolé. */
  history: PreviousTurn[];
};

/**
 * Les données reçues couvrent toute la conversation : au second tour,
 * l'agent peut reprendre des chiffres reçus au premier sans rappeler
 * d'outil.
 */
export function buildEvidence({
  turn,
  matter: kind,
}: {
  turn: ScenarioTurn;
  matter: MatterKind;
}): Evidence {
  const { matter, dashboard } = extractMatter({
    kind,
    text: turn.text,
    toolCalls: turn.toolCalls,
    toolResults: turn.toolResults,
  });
  const toolResults = [
    ...turn.history.flatMap((previous) => previous.toolResults),
    ...turn.toolResults,
  ];

  return {
    question: turn.question,
    profile: turn.profile,
    currentTerritory: turn.currentTerritory,
    answer: turn.text,
    matter,
    dashboard,
    toolCalls: turn.toolCalls,
    toolResults: toolResults.map(({ toolName, output }) => ({
      toolName,
      output,
    })),
    maskedTerritories: maskedTerritories({
      toolResults,
      userTerritories: turn.userTerritories,
    }),
    truth: turn.truth,
    tableTerritories: turn.tableTerritories,
    conversation: turn.history.map((previous) => ({
      question: previous.question,
      answer: previous.text,
    })),
  };
}
