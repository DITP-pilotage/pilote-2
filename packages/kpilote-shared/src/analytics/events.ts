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
  collection_id?: string
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

export type CollectionOngletContext = {
  entity_id: string
  onglet: string
}

export type CollectionResultatsViewContext = {
  entity_id: string
  indicateurs_count: number
}

export type CollectionViewContext = {
  entity_id: string
}

export type CollectionIndividuChangeContext = {
  referentiel_id: string
}

export type CommandPaletteOpenContext = {
  method: 'keyboard' | 'button'
}

export type CommandPaletteSearchContext = {
  results_count: number
}

export type CommandPaletteNoResultContext = {
  query_length_bucket: string
}

export type CommandPaletteCommandRunContext = {
  command_group: string
  target_type: string
}

export type CommandPaletteActionRunContext = {
  action_type: string
  target_type: string
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
  commandPalette: {
    open: (context: CommandPaletteOpenContext): AnalyticsEvent => ({
      category: 'kpilote.command_palette',
      action: 'open',
      name: 'command_palette.open',
      context: { ...context },
    }),
    search: (context: CommandPaletteSearchContext): AnalyticsEvent => ({
      category: 'kpilote.command_palette',
      action: 'search',
      name: 'command_palette.search',
      context: { ...context },
    }),
    noResult: (context: CommandPaletteNoResultContext): AnalyticsEvent => ({
      category: 'kpilote.command_palette',
      action: 'error',
      name: 'command_palette.no_result',
      context: { ...context },
    }),
    commandRun: (context: CommandPaletteCommandRunContext): AnalyticsEvent => ({
      category: 'kpilote.command_palette',
      action: 'select',
      name: 'command_palette.command.run',
      context: { ...context },
    }),
    actionRun: (context: CommandPaletteActionRunContext): AnalyticsEvent => ({
      category: 'kpilote.command_palette',
      action: 'select',
      name: 'command_palette.action.run',
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
    onglet: (context: CollectionOngletContext): AnalyticsEvent => ({
      category: 'kpilote.collection',
      action: 'switch',
      name: 'collection.onglet',
      context: { ...context },
    }),
    resultatsView: (context: CollectionResultatsViewContext): AnalyticsEvent => ({
      category: 'kpilote.collection',
      action: 'view',
      name: 'collection.resultats.view',
      context: { ...context },
    }),
    gouvernanceView: (context: CollectionViewContext): AnalyticsEvent => ({
      category: 'kpilote.collection',
      action: 'view',
      name: 'collection.gouvernance.view',
      context: { ...context },
    }),
    individuChange: (context: CollectionIndividuChangeContext): AnalyticsEvent => ({
      category: 'kpilote.collection',
      action: 'filter',
      name: 'collection.individu.change',
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
