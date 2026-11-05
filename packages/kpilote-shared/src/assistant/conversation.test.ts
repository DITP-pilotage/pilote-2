import { describe, expect, it } from 'vitest'

import { deriveTitle } from './conversation'

describe('deriveTitle', () => {
  it('reprend la première question, tronquée', () => {
    const long = 'a'.repeat(100)
    expect(deriveTitle([{ role: 'user', parts: [{ type: 'text', text: long }] }])).toBe(
      `${'a'.repeat(79)}…`,
    )
  })

  it('nomme une conversation sans question', () => {
    expect(deriveTitle([])).toBe('Nouvelle conversation')
  })
})
