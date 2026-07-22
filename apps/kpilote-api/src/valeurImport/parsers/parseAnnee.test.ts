import { describe, expect, it } from 'vitest'

import { parseAnnee } from '@/valeurImport/parsers/parseAnnee'

describe('parseAnnee', () => {
  it('résout une année au 1er janvier', () => {
    expect(parseAnnee('2023')).toBe('2023-01-01')
  })

  it('extrait une année plausible depuis du bruit', () => {
    expect(parseAnnee('Émissions 2021 en kt')).toBe('2021-01-01')
  })

  it('refuse plusieurs années (ambiguïté)', () => {
    expect(parseAnnee('2020-2023')).toBeNull()
    expect(parseAnnee('CA 2021 vs 2020')).toBeNull()
  })

  it('ne confond pas un identifiant avec une année', () => {
    expect(parseAnnee('Zone 1234')).toBeNull()
    expect(parseAnnee('5000 habitants')).toBeNull()
  })
})
