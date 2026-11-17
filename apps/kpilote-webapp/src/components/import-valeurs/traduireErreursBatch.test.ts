import { describe, expect, it } from 'vitest'
import {
  traduireErreursBatch,
  traduireIssuesValidation,
} from '@/components/import-valeurs/traduireErreursBatch'
import type { ValidationIssueApiModel } from '@pilote/kpilote-shared/error'

describe('traduireErreursBatch', () => {
  it('utilise le singulier « ligne » pour un seul indice', () => {
    const messages = traduireErreursBatch({
      details: { errors: [{ code: 'INDIVIDU_INCONNU', indices: [0], individu: 'DEPT-1' }] },
    })
    expect(messages).toEqual(['Individu inconnu « DEPT-1 » (ligne 2).'])
  })

  it('traduit chaque code en message FR avec numéro de ligne (index + 2)', () => {
    const messages = traduireErreursBatch({
      details: {
        errors: [
          { code: 'INVALID_ITEM', indices: [2], issues: [{ path: 'date', message: 'x' }] },
          { code: 'INDIVIDU_INCONNU', indices: [0, 5], individu: 'DEPT-99' },
          { code: 'DUPLICATE_KEY', indices: [1, 3], individu: 'DEPT-84', date: '2024-01-15' },
        ],
      },
    })
    expect(messages).toEqual([
      'Ligne 4 : champ « date » invalide.',
      'Individu inconnu « DEPT-99 » (lignes 2, 7).',
      'Doublon DEPT-84 / 2024-01-15 (lignes 3, 5).',
    ])
  })

  it('traduit les erreurs de modalités', () => {
    const messages = traduireErreursBatch({
      details: {
        errors: [
          {
            code: 'DUPLICATE_KEY',
            indices: [0, 1],
            individu: 'DEPT-84',
            modalites: ['OP-ORANGE'],
            date: '2024-01-15',
          },
          { code: 'MODALITE_INCONNUE', indices: [2], modalite: 'OP-XXX' },
          { code: 'AXE_NON_DECLARE', indices: [3], modalite: 'FR-TVA' },
          { code: 'MODALITES_MEME_AXE', indices: [4], axe: 'AXE-OPERATEUR' },
          { code: 'MODALITE_MANQUANTE', indices: [5, 6], axe: 'AXE-OPERATEUR' },
          { code: 'MODALITE_NON_FEUILLE', indices: [7], modalite: 'FR-FISCALE' },
        ],
      },
    })
    expect(messages).toEqual([
      'Doublon DEPT-84 / OP-ORANGE / 2024-01-15 (lignes 2, 3).',
      'Modalité inconnue « OP-XXX » (ligne 4).',
      'Modalité « FR-TVA » d’un axe que l’indicateur ne déclare pas (ligne 5).',
      'Plusieurs modalités de l’axe AXE-OPERATEUR (ligne 6).',
      'Modalité manquante pour l’axe AXE-OPERATEUR (lignes 7, 8).',
      'Modalité « FR-FISCALE » non saisissable : sa valeur se calcule à partir de ses sous-modalités (ligne 9).',
    ])
  })
})

describe('traduireIssuesValidation', () => {
  it('traduit les issues zod avec path ["items", index, champ]', () => {
    const issues: ValidationIssueApiModel[] = [
      {
        path: ['items', 2, 'date'],
        message: 'Date calendaire invalide',
        code: 'custom',
      },
    ]
    const messages = traduireIssuesValidation({ issues })
    expect(messages).toEqual(['Ligne 4 : champ « date » invalide — Date calendaire invalide'])
  })

  it('fallback "Ligne inconnue" si pas d\'index numérique dans le path', () => {
    const issues: ValidationIssueApiModel[] = [
      {
        path: ['root'],
        message: 'Erreur de validation globale',
        code: 'custom',
      },
    ]
    const messages = traduireIssuesValidation({ issues })
    expect(messages).toEqual(['Ligne inconnue : Erreur de validation globale'])
  })

  it('traite plusieurs issues', () => {
    const issues: ValidationIssueApiModel[] = [
      {
        path: ['items', 0, 'individu'],
        message: 'Requis',
        code: 'required',
      },
      {
        path: ['items', 1, 'date'],
        message: 'Format de date invalide',
        code: 'invalid_date',
      },
    ]
    const messages = traduireIssuesValidation({ issues })
    expect(messages).toEqual([
      'Ligne 2 : champ « individu » invalide — Requis',
      'Ligne 3 : champ « date » invalide — Format de date invalide',
    ])
  })
})
