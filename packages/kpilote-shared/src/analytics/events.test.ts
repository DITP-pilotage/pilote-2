import { describe, expect, it } from 'vitest'

import { analyticsEvents } from './events'
import { ANALYTICS_ACTIONS, ANALYTICS_CATEGORIES, type AnalyticsEvent } from './schema'

type AnyEventFactory = (context: Record<string, string>) => AnalyticsEvent

describe('analyticsEvents', () => {
  it('décrit une erreur de mutation', () => {
    expect(analyticsEvents.error.mutation({ mutation: 'creerCommentaire', status: '500' })).toEqual(
      {
        category: 'kpilote.error',
        action: 'error',
        name: 'mutation.error',
        context: { mutation: 'creerCommentaire', status: '500' },
      },
    )
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
