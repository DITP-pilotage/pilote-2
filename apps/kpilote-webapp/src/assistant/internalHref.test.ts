import { describe, expect, it } from 'vitest'

import { isInternalHref } from './internalHref'

describe('isInternalHref', () => {
  it('reconnaît un chemin de l’application', () => {
    expect(isInternalHref('/indicateurs/IND-1')).toBe(true)
  })

  it('écarte les liens vers un autre site ou sans chemin', () => {
    expect(isInternalHref('//exemple.fr')).toBe(false)
    // Les navigateurs lisent l'antislash comme une barre : `/\exemple.fr` part ailleurs.
    expect(isInternalHref('/\\exemple.fr')).toBe(false)
    expect(isInternalHref('/\texemple.fr')).toBe(false)
    expect(isInternalHref('https://exemple.fr')).toBe(false)
    expect(isInternalHref('#ancre')).toBe(false)
    expect(isInternalHref(undefined)).toBe(false)
  })
})
