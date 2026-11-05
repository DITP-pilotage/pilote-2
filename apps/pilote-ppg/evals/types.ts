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

/**
 * Une option qu'un cas interdit de proposer. `motif` est le source d'une
 * expression régulière, testée sans tenir compte de la casse : une chaîne,
 * pas une `RegExp`, pour que l'entrée du cas reste sérialisable.
 */
export type OptionInterdite = { motif: string; raison: string };

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
  /**
   * Options de `clarify_with_choices` irréalisables : une seule option
   * proposée dont le libellé correspond note le cas à 0.
   */
  optionsInterdites?: OptionInterdite[];
  /**
   * Le territoire et le jalon sélectionnés sur l'accueil. Absent : aucun
   * contexte, le jalon par défaut et pas de territoire courant.
   */
  contexteAccueil?: { territoireCode: string; jalon: number };
};
