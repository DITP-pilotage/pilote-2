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

const roleOf = (message: unknown): { role: 'user' | 'assistant'; message: object } | null => {
  if (typeof message !== 'object' || message === null || !('role' in message)) return null
  if (message.role === 'user' || message.role === 'assistant') {
    return { role: message.role, message }
  }
  return null
}

/**
 * Le fil d'une conversation, tour par tour : chaque question, le texte de sa réponse, et
 * l'appel qui l'a produite (un appel par réponse, dans l'ordre).
 */
export const assistantTurns = <A>(
  messages: ReadonlyArray<unknown>,
  appels: ReadonlyArray<A>,
): AssistantTurn<A>[] => {
  const turns: Array<{ question: string; reponse: string }> = []
  for (const entry of messages) {
    const typed = roleOf(entry)
    if (!typed) continue
    if (typed.role === 'user') {
      turns.push({ question: textOf(typed.message), reponse: '' })
      continue
    }
    const current = turns.at(-1)
    if (!current) continue
    const text = textOf(typed.message)
    current.reponse =
      current.reponse && text ? `${current.reponse}\n\n${text}` : current.reponse || text
  }
  return turns.map((turn, index) => ({ ...turn, appel: appels[index] ?? null }))
}
