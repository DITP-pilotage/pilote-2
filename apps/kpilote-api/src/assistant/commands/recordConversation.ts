import { db } from '@/framework/persistence/dbStore'

const MAX_TITLE_LENGTH = 80

/** Premier message utilisateur, tronqué. Suffit à retrouver une conversation dans une liste. */
export const deriveTitle = (messages: ReadonlyArray<unknown>): string => {
  for (const message of messages) {
    const candidate = message as { role?: string; parts?: ReadonlyArray<unknown> }
    if (candidate.role !== 'user') continue
    const text = (candidate.parts ?? [])
      .filter((part): part is { type: 'text'; text: string } => {
        const current = part as { type?: string }
        return current.type === 'text'
      })
      .map((part) => part.text)
      .join(' ')
      .trim()
    if (text.length === 0) continue
    return text.length > MAX_TITLE_LENGTH ? `${text.slice(0, MAX_TITLE_LENGTH - 1)}…` : text
  }
  return 'Nouvelle conversation'
}

// Aller-retour JSON explicite : le sérialiseur de Prisma plante sur les schémas zod que le
// SDK attache aux définitions d'outils présentes dans les parts.
const toPlainJson = (value: unknown): object => JSON.parse(JSON.stringify(value)) as object

export const recordConversation = async ({
  id,
  principalId,
  surface,
  messages,
}: {
  id: string
  principalId: string
  surface: string
  messages: ReadonlyArray<unknown>
}): Promise<void> => {
  const blob = toPlainJson(messages)
  await db().assistantConversation.upsert({
    where: { id },
    create: { id, principalId, surface, titre: deriveTitle(messages), messages: blob },
    update: { messages: blob },
  })
}

export const recordCall = async ({
  conversationId,
  principalId,
  model,
  surface,
  transcript,
  inputTokens,
  outputTokens,
  dureeMs,
}: {
  conversationId: string
  principalId: string
  model: string
  surface: string
  transcript: unknown
  inputTokens: number
  outputTokens: number
  dureeMs: number
}): Promise<void> => {
  await db().assistantAppel.create({
    data: {
      conversationId,
      principalId,
      modele: model,
      surface,
      transcript: toPlainJson(transcript),
      inputTokens,
      outputTokens,
      dureeMs,
    },
  })
}
