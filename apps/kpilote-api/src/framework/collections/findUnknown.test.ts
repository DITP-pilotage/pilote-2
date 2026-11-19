import { describe, expect, it } from 'vitest'

import { findUnknown } from '@/framework/collections/findUnknown'

describe.concurrent('findUnknown', () => {
  it('renvoie les ids demandés absents des ids trouvés, sans doublon et triés', () => {
    expect(findUnknown({ requested: ['c', 'a', 'b', 'c'], found: ['b'] })).toEqual(['a', 'c'])
  })

  it('renvoie une liste vide quand tout est trouvé', () => {
    expect(findUnknown({ requested: ['a'], found: ['a', 'b'] })).toEqual([])
  })
})
