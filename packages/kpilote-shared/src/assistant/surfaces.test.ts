import { describe, expect, it } from 'vitest'

import { chatRequestSchema, contexteEntiteSchema } from './surfaces'

const conversationId = '018f3a2b-0000-7000-8000-000000000000'

describe('chatRequestSchema', () => {
  it('accepte une requête ask-libre', () => {
    expect(
      chatRequestSchema.safeParse({ surface: 'ask-libre', conversationId, messages: [] }).success,
    ).toBe(true)
  })

  it('accepte une surcharge de modèle parmi la liste fermée', () => {
    expect(
      chatRequestSchema.safeParse({
        surface: 'ask-libre',
        conversationId,
        messages: [],
        modele: 'openweight-medium',
      }).success,
    ).toBe(true)
  })

  it('rejette un modèle hors liste', () => {
    expect(
      chatRequestSchema.safeParse({
        surface: 'ask-libre',
        conversationId,
        messages: [],
        modele: 'gpt-4',
      }).success,
    ).toBe(false)
  })

  it('rejette une surface non encore servie par le moteur', () => {
    expect(
      chatRequestSchema.safeParse({ surface: 'ask-entite', conversationId, messages: [] }).success,
    ).toBe(false)
  })

  it('rejette un conversationId qui n’est pas un uuid', () => {
    expect(
      chatRequestSchema.safeParse({ surface: 'ask-libre', conversationId: 'x', messages: [] })
        .success,
    ).toBe(false)
  })
})

describe('contexteEntiteSchema', () => {
  it('exprime une entité seule', () => {
    const resultat = contexteEntiteSchema.safeParse({
      focus: { type: 'indicateur', publicId: 'IND-42' },
    })
    expect(resultat.success).toBe(true)
    expect(resultat.success && resultat.data.cadrage).toEqual([])
  })

  it('exprime une collection vue pour un individu — le cas que le mono-entité ne savait pas dire', () => {
    expect(
      contexteEntiteSchema.safeParse({
        focus: { type: 'collection', publicId: 'COL-7' },
        cadrage: [{ type: 'individu', publicId: 'DEPT-84' }],
      }).success,
    ).toBe(true)
  })

  it('accepte les quatre types d’entité en focus', () => {
    const focus = [
      { type: 'indicateur', publicId: 'IND-1' },
      { type: 'collection', publicId: 'COL-1' },
      { type: 'individu', publicId: 'DEPT-84' },
      { type: 'referentiel', publicId: 'REF-DEPT' },
    ]
    expect(focus.every((f) => contexteEntiteSchema.safeParse({ focus: f }).success)).toBe(true)
  })

  it('rejette un publicId incohérent avec le type déclaré', () => {
    expect(
      contexteEntiteSchema.safeParse({ focus: { type: 'indicateur', publicId: 'COL-7' } }).success,
    ).toBe(false)
  })

  it('borne le cadrage à quatre entités', () => {
    const cadrage = Array.from({ length: 5 }, (_, index) => ({
      type: 'individu' as const,
      publicId: `DEPT-8${index}`,
    }))
    expect(
      contexteEntiteSchema.safeParse({ focus: { type: 'collection', publicId: 'COL-7' }, cadrage })
        .success,
    ).toBe(false)
  })
})
