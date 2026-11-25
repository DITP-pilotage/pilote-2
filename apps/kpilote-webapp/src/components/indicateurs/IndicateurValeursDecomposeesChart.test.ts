import { describe, expect, it } from 'vitest'

import { renderDecomposedTooltip } from './IndicateurValeursDecomposeesChart'

describe('renderDecomposedTooltip', () => {
  it('ne liste que les séries qui ont une valeur ce mois-là', () => {
    const html = renderDecomposedTooltip({
      params: [
        { seriesName: 'Orange', value: 3, dataIndex: 0 },
        { seriesName: 'SFR', value: null, dataIndex: 0 },
      ],
      labels: ['janv. 26'],
      unite: null,
    })
    expect(html).toContain('Orange')
    expect(html).not.toContain('SFR')
  })

  it('échappe le nom de la série, qui vient d’un nom de modalité', () => {
    const html = renderDecomposedTooltip({
      params: [{ seriesName: '<img src=x onerror=alert(1)>', value: 3, dataIndex: 0 }],
      labels: ['janv. 26'],
      unite: null,
    })
    expect(html).not.toContain('<img')
  })
})
