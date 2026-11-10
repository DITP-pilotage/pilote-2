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
})

describe('traduireErreursBatch — multi-dimension', () => {
  it('traduit les erreurs de cellule et de périmètre', () => {
    const messages = traduireErreursBatch({
      details: {
        errors: [
          { code: 'COORDONNEE_MANQUANTE', indices: [0], dimension: 'DIM-OPERATEUR' },
          { code: 'DIMENSION_NON_DECLAREE', indices: [1], individu: 'IS-FRAUDE' },
          { code: 'COORDONNEES_EN_DOUBLE', indices: [2, 3], dimension: 'DIM-TERRITOIRE' },
          { code: 'CELLULE_AGREGEE', indices: [4], individu: 'REG-93' },
          { code: 'HORS_PERIMETRE', indices: [5], individu: 'DEPT-84~OP-SFR' },
        ],
      },
    })
    expect(messages).toEqual([
      'Membre manquant pour la dimension « DIM-OPERATEUR » (ligne 2) : une valeur se saisit avec un membre par dimension.',
      "« IS-FRAUDE » relève d'une dimension que l'indicateur ne déclare pas (ligne 3).",
      'Plusieurs membres de la dimension « DIM-TERRITOIRE » sur une même ligne (lignes 4, 5).',
      '« REG-93 » est un membre agrégé dont la valeur se calcule (ligne 6) : saisissez ses membres détaillés.',
      '« DEPT-84~OP-SFR » est hors de votre périmètre de saisie (ligne 7).',
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
