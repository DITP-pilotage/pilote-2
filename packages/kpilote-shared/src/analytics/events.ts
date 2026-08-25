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

export type IndicateurOngletContext = {
  entity_id: string
  onglet: string
}

export type IndicateurViewContext = {
  entity_id: string
}

export type IndicateurIndividuChangeContext = {
  referentiel_id: string
  source?: 'map'
}

export type CommentaireSectionViewContext = {
  entity_type: AnalyticsEntityType
  section: string
}

export type CommentairePublishContext = {
  entity_type: AnalyticsEntityType
  commentaire_type: string
}

export type ImportValeursSuccessContext = {
  entity_id: string
  created_count: number
  updated_count: number
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
    onglet: (context: IndicateurOngletContext): AnalyticsEvent => ({
      category: 'kpilote.indicateur',
      action: 'switch',
      name: 'indicateur.onglet',
      context: { ...context },
    }),
    resultatsView: (context: IndicateurViewContext): AnalyticsEvent => ({
      category: 'kpilote.indicateur',
      action: 'view',
      name: 'indicateur.resultats.view',
      context: { ...context },
    }),
    metadonneesView: (context: IndicateurViewContext): AnalyticsEvent => ({
      category: 'kpilote.indicateur',
      action: 'view',
      name: 'indicateur.metadonnees.view',
      context: { ...context },
    }),
    individuChange: (context: IndicateurIndividuChangeContext): AnalyticsEvent => ({
      category: 'kpilote.indicateur',
      action: 'filter',
      name: 'indicateur.individu.change',
      context: { ...context },
    }),
  },
  commentaire: {
    sectionView: (context: CommentaireSectionViewContext): AnalyticsEvent => ({
      category: 'kpilote.commentaire',
      action: 'view',
      name: 'commentaire.section.view',
      context: { ...context },
    }),
    publish: (context: CommentairePublishContext): AnalyticsEvent => ({
      category: 'kpilote.commentaire',
      action: 'success',
      name: 'commentaire.publish',
      context: { ...context },
    }),
  },
  import: {
    valeursSuccess: (context: ImportValeursSuccessContext): AnalyticsEvent => ({
      category: 'kpilote.import',
      action: 'success',
      name: 'import.valeurs.success',
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
