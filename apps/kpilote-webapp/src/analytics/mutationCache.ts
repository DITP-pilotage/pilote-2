import { MutationCache } from '@tanstack/react-query'
import { HTTPError } from 'ky'

import type { AnalyticsEvent } from '@pilote/kpilote-shared/analytics/schema'
import { analyticsEvents } from '@pilote/kpilote-shared/analytics/events'

import { analytics } from '@/analytics/tracker'

type AnalyticsMutationMeta = Record<string, unknown> & {
  analyticsName?: string
  analyticsSuccess?: AnalyticsEvent
}

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: AnalyticsMutationMeta
  }
}

const errorStatus = (error: unknown): string =>
  error instanceof HTTPError ? String(error.response.status) : 'network'

export const createAnalyticsMutationCache = (): MutationCache =>
  new MutationCache({
    onSuccess: (_data, _variables, _onMutateResult, mutation) => {
      try {
        const event = mutation.meta?.analyticsSuccess
        if (event) analytics.trackEvent(event)
      } catch {
        // L'analytics ne peut pas casser une mutation.
      }
    },
    onError: (error, _variables, _onMutateResult, mutation) => {
      try {
        analytics.trackEvent(
          analyticsEvents.error.mutation({
            mutation: mutation.meta?.analyticsName ?? 'inconnue',
            status: errorStatus(error),
          }),
        )
      } catch {
        // L'analytics ne peut pas casser une mutation.
      }
    },
  })
