import { z } from 'zod'

export const MAX_CONVERSATIONS = 50

const MAX_TITLE_LENGTH = 80

const textPartSchema = z.object({ type: z.literal('text'), text: z.string() })

const userMessageSchema = z.object({
  role: z.literal('user'),
  parts: z.array(z.unknown()).catch([]),
})

const textOfPart = (part: unknown): string[] => {
  const parsed = textPartSchema.safeParse(part)
  return parsed.success ? [parsed.data.text] : []
}

/** Premier message utilisateur, tronqué : de quoi retrouver une conversation dans une liste. */
export const deriveTitle = (messages: ReadonlyArray<unknown>): string => {
  for (const message of messages) {
    const userMessage = userMessageSchema.safeParse(message)
    if (!userMessage.success) continue
    const text = userMessage.data.parts.flatMap(textOfPart).join(' ').trim()
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
