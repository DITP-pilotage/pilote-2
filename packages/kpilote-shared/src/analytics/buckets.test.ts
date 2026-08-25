import { describe, expect, it } from 'vitest'

import { bucketQueryLength } from './buckets'

describe('bucketQueryLength', () => {
  it.each([
    [0, '0'],
    [1, '1-2'],
    [2, '1-2'],
    [3, '3-5'],
    [5, '3-5'],
    [6, '6-10'],
    [10, '6-10'],
    [11, '11+'],
    [250, '11+'],
  ])('%i tombe dans la tranche %s', (length, bucket) => {
    expect(bucketQueryLength(length)).toBe(bucket)
  })

  it('ne rend jamais de tranche vide', () => {
    for (let length = 0; length <= 30; length += 1) {
      expect(bucketQueryLength(length).length).toBeGreaterThan(0)
    }
  })
})
