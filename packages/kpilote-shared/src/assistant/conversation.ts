import { z } from 'zod'

export const MAX_CONVERSATIONS = 50

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
