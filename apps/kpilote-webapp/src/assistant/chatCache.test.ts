import { describe, expect, it } from 'vitest'

import { remember } from './chatCache'

const cacheOf = (...keys: string[]) => new Map(keys.map((key) => [key, { busy: false }]))
const options = { max: 3, isBusy: (entry: { busy: boolean }) => entry.busy }

describe('remember', () => {
  it('oublie les conversations les moins récemment utilisées au-delà du maximum', () => {
    const cache = cacheOf('a', 'b', 'c')

    const forgotten = remember(cache, 'd', { busy: false }, options)

    expect(forgotten).toEqual(['a'])
    expect([...cache.keys()]).toEqual(['b', 'c', 'd'])
  })

  it('compte une conversation reprise comme la plus récente', () => {
    const cache = cacheOf('a', 'b', 'c')

    remember(cache, 'a', { busy: false }, options)
    const forgotten = remember(cache, 'd', { busy: false }, options)

    expect(forgotten).toEqual(['b'])
    expect([...cache.keys()]).toEqual(['c', 'a', 'd'])
  })

  it('n’oublie pas une conversation dont la réponse est en cours', () => {
    const cache = new Map([
      ['a', { busy: true }],
      ['b', { busy: false }],
      ['c', { busy: false }],
    ])

    const forgotten = remember(cache, 'd', { busy: false }, options)

    expect(forgotten).toEqual(['b'])
    expect(cache.has('a')).toBe(true)
  })
})
