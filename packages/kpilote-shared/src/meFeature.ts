import { z } from 'zod'

import { featureKeySchema } from './feature'

export const meFeatureApiModelSchema = z
  .object({
    features: z
      .array(featureKeySchema)
      .describe('Clés des feature flippings actifs pour l’utilisateur courant.'),
  })
  .describe('Feature flippings actifs résolus pour l’utilisateur authentifié.')
export type MeFeatureApiModel = z.infer<typeof meFeatureApiModelSchema>
