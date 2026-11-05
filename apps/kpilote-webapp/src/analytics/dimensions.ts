import {
  analyticsDimensionListSchema,
  toDimensionSlots,
} from '@pilote/kpilote-shared/analytics/dimensions'

import { analytics } from '@/analytics/tracker'
import { env } from '@/env'

// Au-delà, les envois retenus partent sans dimensions : l'analytics n'attend pas l'API.
const TIMEOUT_MS = 3000

/** Lit la correspondance des dimensions Matomo et la donne au tracker, qui libère ses envois. */
export const loadDimensionSlots = async (): Promise<void> => {
  if (!analytics.status.active) return
  try {
    const response = await fetch(`${env.apiUrl}/analytics/dimensions`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const dimensions = analyticsDimensionListSchema.parse(await response.json())
    analytics.setDimensionSlots(toDimensionSlots(dimensions))
  } catch {
    analytics.setDimensionSlots({})
  }
}
