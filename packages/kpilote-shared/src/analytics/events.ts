import type { AnalyticsEvent } from './schema'

export type ErreurMutationContexte = {
  mutation: string
  status: string
}

export const analyticsEvents = {
  error: {
    mutation: (contexte: ErreurMutationContexte): AnalyticsEvent => ({
      category: 'kpilote.error',
      action: 'error',
      name: 'mutation.error',
      contexte: { ...contexte },
    }),
  },
} as const
