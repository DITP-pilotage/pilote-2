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
