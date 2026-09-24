/**
 * Ce qu'une `task` d'eval rend aux scorers.
 *
 * Les scorers tournent APRÈS la `task`, donc après le rollback : ils ne voient
 * plus la base. Tout ce qu'on veut scorer doit donc figurer ici.
 */

export type ObservedToolCall = { toolName: string; input?: unknown };

export type AgentTurn = {
  toolCalls: ObservedToolCall[];
  text: string;
  stepCount: number;
};

/** Forme commune aux cas des niveaux 2 et 4, scorés sur les tool calls. */
export type ToolCase = {
  question: string;
  /** Ce que le cas cherche à vérifier. Affiché en colonne. */
  reason: string;
  /**
   * Appels attendus. `[]` : aucun outil ne doit être appelé. Absent : rien
   * n'est exigé, seuls les outils interdits sont vérifiés.
   */
  expected?: ObservedToolCall[];
  /** Outils qui ne doivent pas être appelés : un seul appel note le cas à 0. */
  forbidden?: string[];
};
