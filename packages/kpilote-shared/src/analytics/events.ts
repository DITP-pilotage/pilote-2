import type { AnalyticsEvent } from './schema'

export type MutationErrorContext = {
  mutation: string
  status: string
}

export const analyticsEvents = {
  error: {
    mutation: (context: MutationErrorContext): AnalyticsEvent => ({
      category: 'kpilote.error',
      action: 'error',
      name: 'mutation.error',
      context: { ...context },
    }),
  },
} as const
