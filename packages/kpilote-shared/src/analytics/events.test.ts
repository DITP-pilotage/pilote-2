import { describe, expect, it } from 'vitest'

import { analyticsEvents } from './events'
import { ANALYTICS_ACTIONS, ANALYTICS_CATEGORIES, type AnalyticsEvent } from './schema'

type FabriqueAnonyme = (contexte: Record<string, string>) => AnalyticsEvent

describe('analyticsEvents', () => {
  it('décrit une erreur de mutation', () => {
    expect(analyticsEvents.error.mutation({ mutation: 'creerCommentaire', status: '500' })).toEqual(
      {
        category: 'kpilote.error',
        action: 'error',
        name: 'mutation.error',
        contexte: { mutation: 'creerCommentaire', status: '500' },
      },
    )
  })

  it("n'expose que des catégories et des actions du schéma", () => {
    const evenements = Object.values(analyticsEvents).flatMap((groupe) =>
      Object.values(groupe).map((fabrique) => (fabrique as FabriqueAnonyme)({})),
    )

    expect(evenements.length).toBeGreaterThan(0)
    for (const evenement of evenements) {
      expect(ANALYTICS_CATEGORIES).toContain(evenement.category)
      expect(ANALYTICS_ACTIONS).toContain(evenement.action)
      expect(evenement.name.length).toBeGreaterThan(0)
    }
  })
})
