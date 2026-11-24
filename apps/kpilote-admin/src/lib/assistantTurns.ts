import { z } from 'zod'

export type AssistantTurn<A> = { question: string; reponse: string; appel: A | null }

const textPartSchema = z.object({ type: z.literal('text'), text: z.string() })

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  parts: z.array(z.unknown()).catch([]),
  metadata: z.object({ llmCallId: z.string() }).optional().catch(undefined),
})

type Message = z.infer<typeof messageSchema>

const textOfPart = (part: unknown): string[] => {
  const parsed = textPartSchema.safeParse(part)
  return parsed.success ? [parsed.data.text.trim()] : []
}

const textOf = (message: Message): string =>
  message.parts
    .flatMap(textOfPart)
    .filter((text) => text.length > 0)
    .join('\n\n')

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
    const parsed = messageSchema.safeParse(entry)
    if (!parsed.success) continue
    const message = parsed.data
    if (message.role === 'user') {
      turns.push({ question: textOf(message), reponse: '', appel: null })
      continue
    }
    const current = turns.at(-1)
    if (!current) continue
    const text = textOf(message)
    current.reponse = [current.reponse, text].filter((part) => part.length > 0).join('\n\n')
    const callId = message.metadata?.llmCallId
    current.appel = (callId ? byId.get(callId) : undefined) ?? current.appel
  }
  const shown = new Set(turns.flatMap((turn) => (turn.appel ? [turn.appel.id] : [])))
  return { turns, replaced: appels.filter((appel) => !shown.has(appel.id)) }
}
