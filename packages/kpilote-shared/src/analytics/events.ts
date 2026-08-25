import type { AnalyticsEvent } from './schema'

export type AnalyticsEntityType = 'indicateur' | 'collection'

export type AnalyticsSource = 'dashboard' | 'collection' | 'command_palette'

export type MutationErrorContext = {
  mutation: string
  status: string
}

export type DashboardViewContext = {
  from: string
  to: string
}

export type DashboardIndividuChangeContext = {
  referentiel_id: string
}

export type DashboardPaginationContext = {
  entity_type: AnalyticsEntityType
  page_size: number
}

export type EntityOpenContext = {
  entity_id: string
  source: AnalyticsSource
}

export const analyticsEvents = {
  dashboard: {
    view: (context: DashboardViewContext): AnalyticsEvent => ({
      category: 'kpilote.dashboard',
      action: 'switch',
      name: 'dashboard.view',
      context: { ...context },
    }),
    individuChange: (context: DashboardIndividuChangeContext): AnalyticsEvent => ({
      category: 'kpilote.dashboard',
      action: 'filter',
      name: 'dashboard.individu.change',
      context: { ...context },
    }),
    paginationNext: (context: DashboardPaginationContext): AnalyticsEvent => ({
      category: 'kpilote.dashboard',
      action: 'select',
      name: 'dashboard.pagination.next',
      context: { ...context },
    }),
    paginationSize: (context: DashboardPaginationContext): AnalyticsEvent => ({
      category: 'kpilote.dashboard',
      action: 'select',
      name: 'dashboard.pagination.size',
      context: { ...context },
    }),
  },
  indicateur: {
    open: (context: EntityOpenContext): AnalyticsEvent => ({
      category: 'kpilote.indicateur',
      action: 'open',
      name: 'indicateur.open',
      context: { ...context },
    }),
  },
  collection: {
    open: (context: EntityOpenContext): AnalyticsEvent => ({
      category: 'kpilote.collection',
      action: 'open',
      name: 'collection.open',
      context: { ...context },
    }),
  },
  error: {
    mutation: (context: MutationErrorContext): AnalyticsEvent => ({
      category: 'kpilote.error',
      action: 'error',
      name: 'mutation.error',
      context: { ...context },
    }),
  },
} as const
