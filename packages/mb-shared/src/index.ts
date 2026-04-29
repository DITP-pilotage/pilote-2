import { z } from 'zod'

export const SHARED_GREETING = 'Hello from @pilote/mb-shared'

export const sharedMessageSchema = z.object({
  greeting: z.string(),
})

export type SharedMessage = z.infer<typeof sharedMessageSchema>
