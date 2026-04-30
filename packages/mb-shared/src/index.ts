import { z } from 'zod'

export const SHARED_GREETING = 'Hello from @pilote/mb-shared'

export const sharedMessageSchema = z.object({
  greeting: z.string().describe('Salutation partagée renvoyée par le backend'),
})

export type SharedMessage = z.infer<typeof sharedMessageSchema>
