import { describe, expect, it } from 'vitest'

import { renderTooltip } from './IndicateurValeursChart'

describe('renderTooltip', () => {
  it('échappe le nom de la série, qui peut venir d’un nom de modalité', () => {
    const html = renderTooltip({
      params: [{ seriesName: '<img src=x onerror=alert(1)>', value: 3, dataIndex: 0 }],
      labels: ['janv. 26'],
      valeursByIndex: [3],
      tauxByIndex: [null],
      unite: null,
    })
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })
})
