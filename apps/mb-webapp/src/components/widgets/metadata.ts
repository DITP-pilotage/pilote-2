import { z } from 'zod'

export const codeInseeMetadataSchema = z.object({
  codeInsee: z.string().min(1),
})
export type CodeInseeMetadata = z.infer<typeof codeInseeMetadataSchema>
