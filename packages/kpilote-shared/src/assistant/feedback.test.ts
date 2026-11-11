import { describe, expect, it } from 'vitest'

import { rateBodySchema } from './feedback'

describe('rateBodySchema', () => {
  it('refuse un commentaire démesuré', () => {
    expect(
      rateBodySchema.safeParse({ evaluation: 'POSITIVE', commentaire: 'a'.repeat(2001) }).success,
    ).toBe(false)
  })

  it('exige un commentaire pour la catégorie AUTRE', () => {
    expect(
      rateBodySchema.safeParse({ evaluation: 'NEGATIVE', categories: ['AUTRE'] }).success,
    ).toBe(false)
  })
})
