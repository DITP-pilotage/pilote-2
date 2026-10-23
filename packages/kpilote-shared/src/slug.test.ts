import { describe, expect, it } from 'vitest'

import { SLUG_BASE_MAX_LENGTH, slugify, slugSchema } from './slug'

describe('slugify', () => {
  it('dérive un slug lisible du nom de l’entité', () => {
    expect(slugify('Bilan de prévention')).toBe('bilan-de-prevention')
  })

  it('retire les diacritiques et la ponctuation', () => {
    expect(slugify('Bilan de prévention !')).toBe('bilan-de-prevention')
    expect(slugify('Émissions (CO₂) — 2027')).toBe('emissions-co-2027')
  })

  it('fusionne les séparateurs consécutifs et ne laisse aucun tiret aux extrémités', () => {
    expect(slugify('  --- Taux   de  chômage ---  ')).toBe('taux-de-chomage')
  })

  it('tronque à la longueur laissant place au suffixe de déduplication', () => {
    const slug = slugify('a'.repeat(SLUG_BASE_MAX_LENGTH + 20))

    expect(slug).toHaveLength(SLUG_BASE_MAX_LENGTH)
  })

  it('retourne une chaîne vide quand le texte ne contient aucun alphanumérique', () => {
    expect(slugify('??? !!!')).toBe('')
  })
})

describe('slugSchema', () => {
  it('accepte les identifiants historiques, quelle que soit leur casse', () => {
    for (const identifiant of ['IND-005', 'COL-001', 'REF-DEPT', 'DEPT-84', 'FR', 'WID-CARTE-DEPT'])
      expect(slugSchema.safeParse(identifiant).success).toBe(true)
  })

  it('accepte un slug dérivé d’un nom', () => {
    expect(slugSchema.safeParse('bilan-de-prevention-2').success).toBe(true)
  })

  it('refuse le vide, les tirets aux extrémités ou doublés, et les caractères hors slug', () => {
    for (const invalide of ['', '-abc', 'abc-', 'a--b', 'bilan de prevention', 'accentué', 'a_b'])
      expect(slugSchema.safeParse(invalide).success).toBe(false)
  })
})
