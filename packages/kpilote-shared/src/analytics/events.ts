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

export type AssistantView = 'fullscreen' | 'centered' | 'sidePanel' | 'floating'

export type AssistantOpenContext = {
  source: 'palette' | 'pastille'
  view: AssistantView
}

export type AssistantViewContext = {
  view: AssistantView
}

export type AssistantViewChangeContext = {
  from: AssistantView
  to: AssistantView
}

export type AssistantConversationContext = {
  conversation_id: string
}

export type AssistantCallContext = AssistantConversationContext & {
  llm_call_id?: string | undefined
}

export type PropositionViewContext = {
  nombre_choix: number
  page_type: 'indicateur' | 'collection' | 'autre'
}

export type PropositionClickContext = {
  proposition_id: string
  proposition_mode: 'envoi_direct' | 'preremplissage'
}

export type QuestionSendContext = AssistantConversationContext & {
  type_question: 'premiere_libre' | 'premiere_proposition' | 'suivante'
  origine: 'saisie' | 'proposition' | 'palette' | 'choix'
}

export type ResponseChoicesContext = AssistantCallContext & {
  nombre_choix: number
}

export type FeedbackNegativeContext = AssistantCallContext & {
  categories: string
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
  assistant: {
    open: (context: AssistantOpenContext): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'open',
      name: 'assistant.open',
      context: { ...context },
    }),
    resume: (context: AssistantViewContext): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'open',
      name: 'assistant.resume',
      context: { ...context },
    }),
    minimize: (context: AssistantViewContext): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'select',
      name: 'assistant.minimize',
      context: { ...context },
    }),
    viewChange: (context: AssistantViewChangeContext): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'switch',
      name: 'assistant.view.change',
      context: { ...context },
    }),
    conversationNew: (): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'select',
      name: 'conversation.new',
    }),
    historyOpen: (): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'open',
      name: 'conversation.history.open',
    }),
    historySelect: (): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'select',
      name: 'conversation.history.select',
    }),
    conversationDelete: (): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'submit',
      name: 'conversation.delete',
    }),
    bannerDismiss: (): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'select',
      name: 'banner.dismiss',
    }),
    propositionView: (context: PropositionViewContext): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'view',
      name: 'prompt_proposition.view',
      context: { ...context },
    }),
    propositionClick: (context: PropositionClickContext): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'select',
      name: 'prompt_proposition.click',
      context: { ...context },
    }),
    questionSend: (context: QuestionSendContext): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'submit',
      name: 'question.send',
      context: { ...context },
    }),
    speechStart: (): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'select',
      name: 'speech.start',
    }),
    answerComplete: (context: AssistantCallContext): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'success',
      name: 'answer.complete',
      context: { ...context },
    }),
    answerError: (context: AssistantConversationContext): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'error',
      name: 'answer.error',
      context: { ...context },
    }),
    answerStop: (context: AssistantConversationContext): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'select',
      name: 'answer.stop',
      context: { ...context },
    }),
    answerRetry: (context: AssistantConversationContext): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'select',
      name: 'answer.retry',
      context: { ...context },
    }),
    answerFollow: (context: AssistantConversationContext): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'select',
      name: 'answer.follow',
      context: { ...context },
    }),
    responseChoices: (context: ResponseChoicesContext): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'view',
      name: 'response.choices',
      context: { ...context },
    }),
    responseChoice: (context: AssistantConversationContext): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'select',
      name: 'response.choice',
      context: { ...context },
    }),
    responseChoiceOther: (context: AssistantConversationContext): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'select',
      name: 'response.choice.other',
      context: { ...context },
    }),
    linkInternal: (): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'select',
      name: 'response.link.internal',
    }),
    linkExternal: (): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'select',
      name: 'response.link.external',
    }),
    helpCenterLink: (): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'select',
      name: 'response.help_center.link',
    }),
    exportText: (context: AssistantCallContext): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'success',
      name: 'export.text',
      context: { ...context },
    }),
    exportDashboardImage: (context: AssistantCallContext): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'success',
      name: 'export.dashboard_image',
      context: { ...context },
    }),
    exportReportCopy: (context: AssistantCallContext): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'success',
      name: 'export.report_copy',
      context: { ...context },
    }),
    exportReportPdf: (context: AssistantCallContext): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'success',
      name: 'export.report_pdf',
      context: { ...context },
    }),
    feedbackPositive: (context: AssistantCallContext): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'submit',
      name: 'feedback.positive',
      context: { ...context },
    }),
    feedbackNegative: (context: FeedbackNegativeContext): AnalyticsEvent => ({
      category: 'kpilote.assistant',
      action: 'submit',
      name: 'feedback.negative',
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
