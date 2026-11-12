import { describe, expect, it } from 'vitest'

import { indicateurIdInput, individuIdInput, normalizePublicId } from './ids'

describe('normalizePublicId', () => {
  it.each([
    ['ind 42', 'IND-42'],
    [' IND-042 ', 'IND-042'],
    ['ind_7', 'IND-7'],
    ['IND42', 'IND-42'],
  ])('normalise %s', (raw, expected) => {
    expect(normalizePublicId('IND', raw)).toBe(expected)
  })

  it('laisse passer un slug tel quel', () => {
    expect(normalizePublicId('IND', ' fraude-fiscale ')).toBe('fraude-fiscale')
  })

  it("ne confond pas les préfixes d'entités", () => {
    expect(normalizePublicId('COL', 'IND-4')).toBe('IND-4')
  })
})

describe("schémas d'identifiants", () => {
  it("normalisent l'identifiant écrit par le modèle", () => {
    expect(indicateurIdInput.parse('ind 12')).toBe('IND-12')
  })

  it('mettent un identifiant d’individu en capitales', () => {
    expect(individuIdInput.parse(' dept-84 ')).toBe('DEPT-84')
  })
})
