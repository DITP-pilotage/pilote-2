import { describe, expect, it } from 'vitest'

import { describeVariation } from '@/lib/variation'

describe('describeVariation', () => {
  it('lit une hausse comme favorable pour un indicateur à la hausse', () => {
    expect(describeVariation({ variation: 0.5, sensSouhaite: 'HAUSSE' })).toEqual({
      arrow: '↑',
      direction: 'EN HAUSSE',
      interpretation: 'favorable',
    })
  })

  it('lit une hausse comme défavorable pour un indicateur à la baisse', () => {
    expect(describeVariation({ variation: 0.5, sensSouhaite: 'BAISSE' })).toEqual({
      arrow: '↑',
      direction: 'EN HAUSSE',
      interpretation: 'unfavorable',
    })
  })

  it('lit une baisse comme favorable pour un indicateur à la baisse', () => {
    expect(describeVariation({ variation: -0.8, sensSouhaite: 'BAISSE' })).toEqual({
      arrow: '↓',
      direction: 'EN BAISSE',
      interpretation: 'favorable',
    })
  })

  it("lit comme stable une variation qui s'affiche « 0 » après arrondi", () => {
    expect(describeVariation({ variation: 0.0001, sensSouhaite: 'HAUSSE' })).toEqual({
      arrow: '→',
      direction: 'STABLE',
      interpretation: 'neutral',
    })
  })
})
