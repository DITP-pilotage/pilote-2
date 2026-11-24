import { describe, expect, it } from 'vitest'

import { findDuplicates } from '@/framework/collections/findDuplicates'

describe.concurrent('findDuplicates', () => {
  it('renvoie chaque valeur présente plus d’une fois, une seule fois', () => {
    expect(findDuplicates(['b', 'a', 'b', 'c', 'b', 'a'])).toEqual(['b', 'a'])
  })

  it('renvoie une liste vide sans doublon', () => {
    expect(findDuplicates(['a', 'b'])).toEqual([])
  })
})
