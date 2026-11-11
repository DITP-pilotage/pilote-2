import { describe, expect, it } from 'vitest'

import { analyticsEvents } from './events'
import { ANALYTICS_ACTIONS, ANALYTICS_CATEGORIES, type AnalyticsEvent } from './schema'

type AnyEventFactory = (context: Record<string, string>) => AnalyticsEvent

// Le triplet catégorie / action / nom est le contrat du plan de taggage : c'est
// lui qui détermine dans quel rapport Matomo l'événement atterrit. Le figer ici
// fait échouer le test si un renommage le fait dériver.
const CONTRAT = [
  ['dashboard.view', analyticsEvents.dashboard.view, 'kpilote.dashboard', 'switch'],
  [
    'dashboard.individu.change',
    analyticsEvents.dashboard.individuChange,
    'kpilote.dashboard',
    'filter',
  ],
  [
    'dashboard.pagination.next',
    analyticsEvents.dashboard.paginationNext,
    'kpilote.dashboard',
    'select',
  ],
  [
    'dashboard.pagination.size',
    analyticsEvents.dashboard.paginationSize,
    'kpilote.dashboard',
    'select',
  ],
  ['indicateur.open', analyticsEvents.indicateur.open, 'kpilote.indicateur', 'open'],
  ['indicateur.onglet', analyticsEvents.indicateur.onglet, 'kpilote.indicateur', 'switch'],
  [
    'indicateur.resultats.view',
    analyticsEvents.indicateur.resultatsView,
    'kpilote.indicateur',
    'view',
  ],
  [
    'indicateur.metadonnees.view',
    analyticsEvents.indicateur.metadonneesView,
    'kpilote.indicateur',
    'view',
  ],
  [
    'indicateur.individu.change',
    analyticsEvents.indicateur.individuChange,
    'kpilote.indicateur',
    'filter',
  ],
  [
    'commentaire.section.view',
    analyticsEvents.commentaire.sectionView,
    'kpilote.commentaire',
    'view',
  ],
  ['commentaire.publish', analyticsEvents.commentaire.publish, 'kpilote.commentaire', 'success'],
  ['import.valeurs.success', analyticsEvents.import.valeursSuccess, 'kpilote.import', 'success'],
  ['command_palette.open', analyticsEvents.commandPalette.open, 'kpilote.command_palette', 'open'],
  [
    'command_palette.search',
    analyticsEvents.commandPalette.search,
    'kpilote.command_palette',
    'search',
  ],
  [
    'command_palette.no_result',
    analyticsEvents.commandPalette.noResult,
    'kpilote.command_palette',
    'error',
  ],
  [
    'command_palette.command.run',
    analyticsEvents.commandPalette.commandRun,
    'kpilote.command_palette',
    'select',
  ],
  [
    'command_palette.action.run',
    analyticsEvents.commandPalette.actionRun,
    'kpilote.command_palette',
    'select',
  ],
  ['collection.open', analyticsEvents.collection.open, 'kpilote.collection', 'open'],
  ['collection.onglet', analyticsEvents.collection.onglet, 'kpilote.collection', 'switch'],
  [
    'collection.resultats.view',
    analyticsEvents.collection.resultatsView,
    'kpilote.collection',
    'view',
  ],
  [
    'collection.gouvernance.view',
    analyticsEvents.collection.gouvernanceView,
    'kpilote.collection',
    'view',
  ],
  [
    'collection.individu.change',
    analyticsEvents.collection.individuChange,
    'kpilote.collection',
    'filter',
  ],
  ['mutation.error', analyticsEvents.error.mutation, 'kpilote.error', 'error'],
  ['assistant.open', analyticsEvents.assistant.open, 'kpilote.assistant', 'open'],
  ['assistant.resume', analyticsEvents.assistant.resume, 'kpilote.assistant', 'open'],
  ['assistant.minimize', analyticsEvents.assistant.minimize, 'kpilote.assistant', 'select'],
  ['assistant.view.change', analyticsEvents.assistant.viewChange, 'kpilote.assistant', 'switch'],
  ['conversation.new', analyticsEvents.assistant.conversationNew, 'kpilote.assistant', 'select'],
  ['conversation.history.open', analyticsEvents.assistant.historyOpen, 'kpilote.assistant', 'open'],
  [
    'conversation.history.select',
    analyticsEvents.assistant.historySelect,
    'kpilote.assistant',
    'select',
  ],
  [
    'conversation.delete',
    analyticsEvents.assistant.conversationDelete,
    'kpilote.assistant',
    'submit',
  ],
  ['banner.dismiss', analyticsEvents.assistant.bannerDismiss, 'kpilote.assistant', 'select'],
  [
    'prompt_proposition.view',
    analyticsEvents.assistant.propositionView,
    'kpilote.assistant',
    'view',
  ],
  [
    'prompt_proposition.click',
    analyticsEvents.assistant.propositionClick,
    'kpilote.assistant',
    'select',
  ],
  ['question.send', analyticsEvents.assistant.questionSend, 'kpilote.assistant', 'submit'],
  ['speech.start', analyticsEvents.assistant.speechStart, 'kpilote.assistant', 'select'],
  ['answer.complete', analyticsEvents.assistant.answerComplete, 'kpilote.assistant', 'success'],
  ['answer.error', analyticsEvents.assistant.answerError, 'kpilote.assistant', 'error'],
  ['answer.stop', analyticsEvents.assistant.answerStop, 'kpilote.assistant', 'select'],
  ['answer.retry', analyticsEvents.assistant.answerRetry, 'kpilote.assistant', 'select'],
  ['answer.follow', analyticsEvents.assistant.answerFollow, 'kpilote.assistant', 'select'],
  ['response.choices', analyticsEvents.assistant.responseChoices, 'kpilote.assistant', 'view'],
  ['response.choice', analyticsEvents.assistant.responseChoice, 'kpilote.assistant', 'select'],
  [
    'response.choice.other',
    analyticsEvents.assistant.responseChoiceOther,
    'kpilote.assistant',
    'select',
  ],
  ['response.link.internal', analyticsEvents.assistant.linkInternal, 'kpilote.assistant', 'select'],
  ['response.link.external', analyticsEvents.assistant.linkExternal, 'kpilote.assistant', 'select'],
  [
    'response.help_center.link',
    analyticsEvents.assistant.helpCenterLink,
    'kpilote.assistant',
    'select',
  ],
  ['export.text', analyticsEvents.assistant.exportText, 'kpilote.assistant', 'success'],
  [
    'export.dashboard_image',
    analyticsEvents.assistant.exportDashboardImage,
    'kpilote.assistant',
    'success',
  ],
  [
    'export.report_copy',
    analyticsEvents.assistant.exportReportCopy,
    'kpilote.assistant',
    'success',
  ],
  ['export.report_pdf', analyticsEvents.assistant.exportReportPdf, 'kpilote.assistant', 'success'],
  ['feedback.positive', analyticsEvents.assistant.feedbackPositive, 'kpilote.assistant', 'submit'],
  ['feedback.negative', analyticsEvents.assistant.feedbackNegative, 'kpilote.assistant', 'submit'],
] as const

describe('analyticsEvents', () => {
  it.each(CONTRAT)('%s est émis en %s / %s', (name, factory, category, action) => {
    const event = (factory as AnyEventFactory)({})

    expect(event.name).toBe(name)
    expect(event.category).toBe(category)
    expect(event.action).toBe(action)
  })

  it('reporte le contexte reçu tel quel', () => {
    expect(analyticsEvents.indicateur.open({ entity_id: 'IND-506', source: 'dashboard' })).toEqual({
      category: 'kpilote.indicateur',
      action: 'open',
      name: 'indicateur.open',
      context: { entity_id: 'IND-506', source: 'dashboard' },
    })
  })

  it("n'expose que des catégories et des actions du schéma", () => {
    const events = Object.values(analyticsEvents).flatMap((group) =>
      Object.values(group).map((factory) => (factory as AnyEventFactory)({})),
    )

    expect(events.length).toBeGreaterThan(0)
    for (const event of events) {
      expect(ANALYTICS_CATEGORIES).toContain(event.category)
      expect(ANALYTICS_ACTIONS).toContain(event.action)
      expect(event.name.length).toBeGreaterThan(0)
    }
  })
})
