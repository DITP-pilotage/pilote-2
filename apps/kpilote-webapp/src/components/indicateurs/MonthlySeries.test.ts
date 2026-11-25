import { describe, expect, it } from 'vitest'

import { buildMonthlyMultiSeries } from './MonthlySeries'

describe('buildMonthlyMultiSeries', () => {
  it('aligne les séries sur un même axe des mois, couvrant toutes leurs valeurs', () => {
    const multi = buildMonthlyMultiSeries({
      series: [
        { key: 'ORANGE', name: 'Orange', valeurs: [{ date: '2026-01-15', valeur: 1 }] },
        {
          key: 'SFR',
          name: 'SFR',
          valeurs: [
            { date: '2026-02-03', valeur: 2 },
            { date: '2026-03-20', valeur: 3 },
          ],
        },
      ],
      windowSize: 2,
    })
    expect(multi.months.map((month) => month.key)).toEqual([
      '2026-01-01',
      '2026-02-01',
      '2026-03-01',
    ])
    expect(multi.series).toEqual([
      { key: 'ORANGE', name: 'Orange', values: [1, null, null] },
      { key: 'SFR', name: 'SFR', values: [null, 2, 3] },
    ])
    expect(multi.defaultWindow).toEqual({ startIndex: 1, endIndex: 2 })
  })

  it('écarte une série sans valeur', () => {
    const multi = buildMonthlyMultiSeries({
      series: [
        { key: 'ORANGE', name: 'Orange', valeurs: [{ date: '2026-01-15', valeur: 1 }] },
        { key: 'SFR', name: 'SFR', valeurs: [] },
      ],
      windowSize: 1,
    })
    expect(multi.series.map((serie) => serie.key)).toEqual(['ORANGE'])
  })
})
