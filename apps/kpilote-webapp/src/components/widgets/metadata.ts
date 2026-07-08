import { type IndividuMetadata } from '@pilote/kpilote-shared/individu'
import { z } from 'zod'

export const codeInseeMetadataSchema = z.object({
  codeInsee: z.string().min(1),
})
export type CodeInseeMetadata = z.infer<typeof codeInseeMetadataSchema>

export const parseCodeInseeMetadata = (metadata: IndividuMetadata): CodeInseeMetadata | null => {
  const result = codeInseeMetadataSchema.safeParse(metadata)
  return result.success ? result.data : null
}
