import { describe, expect, it } from 'vitest'

import { parseMediaAlignment, parseMediaSize } from './mediaLayout'

describe('mediaLayout', () => {
  it('garde une valeur connue', () => {
    expect(parseMediaAlignment('droite')).toBe('droite')
    expect(parseMediaSize('petite')).toBe('petite')
  })

  it('retombe sur le rendu historique quand la valeur est absente ou inconnue', () => {
    expect(parseMediaAlignment(null)).toBe('gauche')
    expect(parseMediaAlignment('milieu')).toBe('gauche')
    expect(parseMediaSize(undefined)).toBe('pleine')
    expect(parseMediaSize('enorme')).toBe('pleine')
  })
})
