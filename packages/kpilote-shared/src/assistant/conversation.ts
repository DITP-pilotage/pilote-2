import { z } from 'zod'

export const MAX_CONVERSATIONS = 50

const MAX_TITLE_LENGTH = 80

const isTextPart = (part: unknown): part is { type: 'text'; text: string } =>
  typeof part === 'object' &&
  part !== null &&
  'type' in part &&
  part.type === 'text' &&
  'text' in part &&
  typeof part.text === 'string'

/** Premier message utilisateur, tronqué : de quoi retrouver une conversation dans une liste. */
export const deriveTitle = (messages: ReadonlyArray<unknown>): string => {
  for (const message of messages) {
    if (typeof message !== 'object' || message === null) continue
    if (!('role' in message) || message.role !== 'user') continue
    const parts = 'parts' in message && Array.isArray(message.parts) ? message.parts : []
    const text = parts
      .filter(isTextPart)
      .map((part) => part.text)
      .join(' ')
      .trim()
    if (text.length === 0) continue
    return text.length > MAX_TITLE_LENGTH ? `${text.slice(0, MAX_TITLE_LENGTH - 1)}…` : text
  }
  return 'Nouvelle conversation'
}

export const conversationSummarySchema = z.object({
  id: z.uuid(),
  titre: z.string().describe('Le début de la première question, ou « Nouvelle conversation ».'),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export type ConversationSummary = z.infer<typeof conversationSummarySchema>

export const conversationListSchema = z.object({
  items: z
    .array(conversationSummarySchema)
    .describe(`Les ${MAX_CONVERSATIONS} conversations les plus récentes du principal.`),
})

export const conversationSchema = conversationSummarySchema.extend({
  messages: z.array(z.unknown()).describe('Les messages, au format UIMessage du SDK `ai`.'),
})

export type Conversation = z.infer<typeof conversationSchema>
