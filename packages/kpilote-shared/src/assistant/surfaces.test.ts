import { describe, expect, it } from 'vitest'

import { chatRequestSchema, entiteContextSchema } from './surfaces'

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
        model: 'openweight-medium',
      }).success,
    ).toBe(true)
  })

  it('rejette un modèle hors liste', () => {
    expect(
      chatRequestSchema.safeParse({
        surface: 'ask-libre',
        conversationId,
        messages: [],
        model: 'gpt-4',
      }).success,
    ).toBe(false)
  })

  it('rejette une surface non encore servie par le moteur', () => {
    expect(
      chatRequestSchema.safeParse({ surface: 'ask-entite', conversationId, messages: [] }).success,
    ).toBe(false)
  })

  it("rejette un conversationId qui n'est pas un uuid", () => {
    expect(
      chatRequestSchema.safeParse({ surface: 'ask-libre', conversationId: 'x', messages: [] })
        .success,
    ).toBe(false)
  })
})

describe('entiteContextSchema', () => {
  it('exprime une entité seule', () => {
    const resultat = entiteContextSchema.safeParse({
      focus: { type: 'indicateur', publicId: 'IND-42' },
    })
    expect(resultat.success).toBe(true)
    expect(resultat.success && resultat.data.scope).toEqual([])
  })

  it('exprime une collection vue pour un individu — le cas que le mono-entité ne savait pas dire', () => {
    expect(
      entiteContextSchema.safeParse({
        focus: { type: 'collection', publicId: 'COL-7' },
        scope: [{ type: 'individu', publicId: 'DEPT-84' }],
      }).success,
    ).toBe(true)
  })

  it("accepte les quatre types d'entité en focus", () => {
    const focus = [
      { type: 'indicateur', publicId: 'IND-1' },
      { type: 'collection', publicId: 'COL-1' },
      { type: 'individu', publicId: 'DEPT-84' },
      { type: 'referentiel', publicId: 'REF-DEPT' },
    ]
    expect(focus.every((f) => entiteContextSchema.safeParse({ focus: f }).success)).toBe(true)
  })

  it('rejette un publicId incohérent avec le type déclaré', () => {
    expect(
      entiteContextSchema.safeParse({ focus: { type: 'indicateur', publicId: 'COL-7' } }).success,
    ).toBe(false)
  })

  it('borne le scope à quatre entités', () => {
    const scope = Array.from({ length: 5 }, (_, index) => ({
      type: 'individu' as const,
      publicId: `DEPT-8${index}`,
    }))
    expect(
      entiteContextSchema.safeParse({ focus: { type: 'collection', publicId: 'COL-7' }, scope })
        .success,
    ).toBe(false)
  })
})
