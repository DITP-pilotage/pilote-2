export const ANALYTICS_CATEGORIES = [
  'kpilote.dashboard',
  'kpilote.indicateur',
  'kpilote.collection',
  'kpilote.commentaire',
  'kpilote.import',
  'kpilote.command_palette',
  'kpilote.admin',
  'kpilote.error',
] as const

export type AnalyticsCategory = (typeof ANALYTICS_CATEGORIES)[number]

export const ANALYTICS_ACTIONS = [
  'view',
  'open',
  'select',
  'switch',
  'filter',
  'search',
  'submit',
  'success',
  'error',
] as const

export type AnalyticsAction = (typeof ANALYTICS_ACTIONS)[number]

export type AnalyticsContexte = Record<string, string | number | boolean | undefined>

export type AnalyticsEvent = {
  category: AnalyticsCategory
  action: AnalyticsAction
  name: string
  value?: number
  contexte?: AnalyticsContexte
}

export type AnalyticsPageView = {
  path: string
  title?: string
  contexte?: AnalyticsContexte
}

export type AnalyticsConfig = {
  matomoUrl: string
  siteId: string
  appUrl: string
  dimensionSlots?: Record<string, number>
  globalContexte?: AnalyticsContexte
}
