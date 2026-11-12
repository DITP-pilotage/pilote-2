import {
  analyticsDimensionListSchema,
  toDimensionSlots,
} from '@pilote/kpilote-shared/analytics/dimensions'

import { analytics, DIMENSIONS_TIMEOUT_MS } from '@/analytics/tracker'
import { env } from '@/env'

/** Lit la correspondance des dimensions Matomo et la donne au tracker, qui libère ses envois. */
export const loadDimensionSlots = async (): Promise<void> => {
  if (!analytics.status.active) return
  try {
    const response = await fetch(`${env.apiUrl}/analytics/dimensions`, {
      signal: AbortSignal.timeout(DIMENSIONS_TIMEOUT_MS),
    })
    const dimensions = analyticsDimensionListSchema.parse(await response.json())
    analytics.setDimensionSlots(toDimensionSlots(dimensions))
  } catch {
    analytics.setDimensionSlots({})
  }
}
