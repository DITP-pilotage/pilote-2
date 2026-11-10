import { describe, expect, it } from 'vitest'

import { buildMonthlyMultiSeries, buildMonthlySeries } from './MonthlySeries'

describe('buildMonthlyMultiSeries', () => {
  it('aligne N séries sur le même axe des mois', () => {
    const multi = buildMonthlyMultiSeries({
      series: [
        {
          key: 'DEPT-84~OP-ORANGE',
          valeurs: [
            { date: '2026-01-01', valeur: 1 },
            { date: '2026-03-15', valeur: 3 },
          ],
        },
        { key: 'DEPT-84~OP-SFR', valeurs: [{ date: '2026-02-01', valeur: 2 }] },
      ],
      windowSize: 3,
    })
    expect(multi.months.map((m) => m.key)).toEqual(['2026-01-01', '2026-02-01', '2026-03-01'])
    expect(multi.series).toEqual([
      { key: 'DEPT-84~OP-ORANGE', values: [1, null, 3] },
      { key: 'DEPT-84~OP-SFR', values: [null, 2, null] },
    ])
    expect(multi.defaultWindow).toEqual({ startIndex: 0, endIndex: 2 })
  })

  it('une seule série : même axe et mêmes valeurs que buildMonthlySeries', () => {
    const valeurs = [
      { date: '2025-06-01', valeur: 10 },
      { date: '2026-01-10', valeur: 12 },
    ]
    const simple = buildMonthlySeries({ valeurs, tauxProgression: [], windowSize: 13 })
    const multi = buildMonthlyMultiSeries({ series: [{ key: 'X', valeurs }], windowSize: 13 })
    expect(multi.months).toEqual(simple.months)
    expect(multi.series[0]?.values).toEqual(simple.values)
    expect(multi.defaultWindow).toEqual(simple.defaultWindow)
  })
})
