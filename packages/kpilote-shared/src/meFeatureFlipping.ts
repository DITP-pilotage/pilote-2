import { z } from 'zod'

import { featureFlippingKeySchema } from './featureFlipping'

export const meFeatureFlippingApiModelSchema = z
  .object({
    features: z
      .array(featureFlippingKeySchema)
      .describe('Clés des feature flippings actifs pour l’utilisateur courant.'),
  })
  .describe('Feature flippings actifs résolus pour l’utilisateur authentifié.')
export type MeFeatureFlippingApiModel = z.infer<typeof meFeatureFlippingApiModelSchema>
