export type AssistantTurn<A> = { question: string; reponse: string; appel: A | null }

const textOf = (message: object): string => {
  const parts = 'parts' in message && Array.isArray(message.parts) ? message.parts : []
  return parts
    .flatMap((part: unknown) =>
      typeof part === 'object' &&
      part !== null &&
      'type' in part &&
      part.type === 'text' &&
      'text' in part &&
      typeof part.text === 'string'
        ? [part.text.trim()]
        : [],
    )
    .filter((text) => text.length > 0)
    .join('\n\n')
}

const callIdOf = (message: object): string | null =>
  'metadata' in message &&
  typeof message.metadata === 'object' &&
  message.metadata !== null &&
  'llmCallId' in message.metadata &&
  typeof message.metadata.llmCallId === 'string'
    ? message.metadata.llmCallId
    : null

const roleOf = (message: unknown): { role: 'user' | 'assistant'; message: object } | null => {
  if (typeof message !== 'object' || message === null || !('role' in message)) return null
  if (message.role === 'user' || message.role === 'assistant') {
    return { role: message.role, message }
  }
  return null
}

/**
 * Le fil d'une conversation, tour par tour : chaque question, le texte de sa réponse et
 * l'appel qui l'a produite, retrouvé par l'identifiant que la réponse porte. Une relance
 * remplace la réponse mais garde l'appel d'origine : il est rendu à part.
 */
export const assistantTurns = <A extends { id: string }>(
  messages: ReadonlyArray<unknown>,
  appels: ReadonlyArray<A>,
): { turns: AssistantTurn<A>[]; replaced: A[] } => {
  const byId = new Map(appels.map((appel) => [appel.id, appel]))
  const turns: AssistantTurn<A>[] = []
  for (const entry of messages) {
    const typed = roleOf(entry)
    if (!typed) continue
    if (typed.role === 'user') {
      turns.push({ question: textOf(typed.message), reponse: '', appel: null })
      continue
    }
    const current = turns.at(-1)
    if (!current) continue
    const text = textOf(typed.message)
    current.reponse = [current.reponse, text].filter((part) => part.length > 0).join('\n\n')
    const callId = callIdOf(typed.message)
    current.appel = (callId ? byId.get(callId) : undefined) ?? current.appel
  }
  const shown = new Set(turns.flatMap((turn) => (turn.appel ? [turn.appel.id] : [])))
  return { turns, replaced: appels.filter((appel) => !shown.has(appel.id)) }
}
