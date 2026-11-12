import { type ModelMessage, pruneMessages } from 'ai'

// Une conversation longue dépasserait la fenêtre de contexte du modèle : chaque tour
// échouerait, relance comprise. On envoie les derniers tours ; les données des outils ne
// restent que pour les plus récents, les réponses rédigées suffisent pour les autres.
export const MAX_TURNS = 10
export const TURNS_WITH_TOOLS = 3

/** Index de la question qui ouvre le n-ième tour en partant de la fin (0 s'il y en a moins). */
const startOfTurn = (messages: ReadonlyArray<ModelMessage>, turnsFromEnd: number): number => {
  let seen = 0
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === 'user') {
      seen += 1
      if (seen === turnsFromEnd) return index
    }
  }
  return 0
}

export const windowHistory = (messages: ModelMessage[]): ModelMessage[] => {
  const kept = messages.slice(startOfTurn(messages, MAX_TURNS))
  // + 1 : la question en cours n'a pas encore d'outils.
  const withTools = kept.length - startOfTurn(kept, TURNS_WITH_TOOLS + 1)
  return pruneMessages({
    messages: kept,
    reasoning: 'before-last-message',
    toolCalls: `before-last-${withTools}-messages`,
    emptyMessages: 'remove',
  })
}
