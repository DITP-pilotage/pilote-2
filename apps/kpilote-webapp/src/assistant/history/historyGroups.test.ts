import { describe, expect, it } from 'vitest'

import { formatConversationDate, groupByPeriod, matchesSearch } from './historyGroups'

const now = new Date(2026, 10, 4, 15, 0)
const at = (year: number, month: number, day: number, hour = 10) => ({
  updatedAt: new Date(year, month, day, hour).toISOString(),
})

describe('groupByPeriod', () => {
  it('regroupe des plus récentes aux plus anciennes', () => {
    const groups = groupByPeriod(
      [at(2026, 10, 4), at(2026, 10, 1), at(2026, 9, 2), at(2025, 11, 20), at(2026, 9, 1)],
      now,
    )

    expect(groups.map((group) => [group.label, group.items.length])).toEqual([
      ["Aujourd'hui", 1],
      ['Cette semaine', 1],
      ['Octobre', 1],
      ['Décembre 2025', 1],
      ['Octobre', 1],
    ])
  })

  it('distingue « Ce mois-ci » de « Cette semaine »', () => {
    expect(groupByPeriod([at(2026, 10, 25)], new Date(2026, 10, 30))[0]?.label).toBe(
      'Cette semaine',
    )
    expect(groupByPeriod([at(2026, 10, 2)], new Date(2026, 10, 30))[0]?.label).toBe('Ce mois-ci')
  })
})

describe('matchesSearch', () => {
  it('ignore accents et casse', () => {
    expect(matchesSearch('Évolution du chômage', 'EVOLUTION du chomage')).toBe(true)
    expect(matchesSearch('Évolution du chômage', 'santé')).toBe(false)
    expect(matchesSearch('Tout', '  ')).toBe(true)
  })
})

describe('formatConversationDate', () => {
  it('donne l’heure pour aujourd’hui, le jour sinon', () => {
    expect(formatConversationDate(new Date(2026, 10, 4, 9, 5).toISOString(), now)).toBe('09:05')
    expect(formatConversationDate(new Date(2026, 9, 2).toISOString(), now)).toBe('2 oct.')
  })
})
