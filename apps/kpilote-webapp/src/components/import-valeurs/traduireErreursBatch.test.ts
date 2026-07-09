import { describe, expect, it } from 'vitest'
import { traduireErreursBatch } from '@/components/import-valeurs/traduireErreursBatch'

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
