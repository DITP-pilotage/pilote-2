import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { importValeursBatch, versItemBatch } from '@/api/valeursImport'
import { apiUrl, server } from '@/tests/server'

describe('importValeursBatch', () => {
  it('retourne ok avec le résultat en cas de succès', async () => {
    server.use(
      http.put(apiUrl('/indicateurs/IND-1/valeurs:batch'), () =>
        HttpResponse.json({ total: 2, created: 1, updated: 1 }),
      ),
    )
    const result = await importValeursBatch({
      indicateurId: 'IND-1',
      rows: [{ individu: 'DEPT-84', date: '2024-01-15', valeur: 7.2 }],
    })
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toEqual({ total: 2, created: 1, updated: 1 })
    }
  })

  it('retourne err BATCH_INVALID sur 400 BATCH_INVALID', async () => {
    server.use(
      http.put(apiUrl('/indicateurs/IND-1/valeurs:batch'), () =>
        HttpResponse.json(
          {
            code: 'BATCH_INVALID',
            message: "Aucune valeur n'a été appliquée.",
            details: { errors: [{ code: 'INDIVIDU_INCONNU', indices: [0], individu: 'DEPT-99' }] },
          },
          { status: 400 },
        ),
      ),
    )
    const result = await importValeursBatch({
      indicateurId: 'IND-1',
      rows: [{ individu: 'DEPT-99', date: '2024-01-15', valeur: 7.2 }],
    })
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('BATCH_INVALID')
      if (result.error.type === 'BATCH_INVALID') {
        expect(result.error.details.errors).toHaveLength(1)
      }
    }
  })

  it('retourne err VALIDATION_ERROR sur 400 VALIDATION_ERROR', async () => {
    server.use(
      http.put(apiUrl('/indicateurs/IND-1/valeurs:batch'), () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            message: 'Corps de requête invalide.',
            details: {
              issues: [
                { path: ['items', 2, 'date'], message: 'Date calendaire invalide', code: 'custom' },
              ],
            },
          },
          { status: 400 },
        ),
      ),
    )
    const result = await importValeursBatch({
      indicateurId: 'IND-1',
      rows: [{ individu: 'DEPT-84', date: '2024-01-15', valeur: 7.2 }],
    })
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('VALIDATION_ERROR')
      if (result.error.type === 'VALIDATION_ERROR') {
        expect(result.error.issues).toHaveLength(1)
      }
    }
  })

  it('envoie `coordonnees` (sans cellule vide) pour une ligne multi-dimension, `individu` sinon', async () => {
    let corps: unknown = null
    server.use(
      http.put(apiUrl('/indicateurs/IND-1/valeurs:batch'), async ({ request }) => {
        corps = await request.json()
        return HttpResponse.json({ total: 2, created: 2, updated: 0 })
      }),
    )
    await importValeursBatch({
      indicateurId: 'IND-1',
      rows: [
        { individu: 'DEPT-84', date: '2024-01-15', valeur: 7.2 },
        {
          individu: 'DEPT-84',
          coordonnees: ['DEPT-84', 'OP-SFR', ''],
          date: '2024-01-15',
          valeur: 3,
        },
      ],
    })
    expect(corps).toStrictEqual({
      items: [
        { individu: 'DEPT-84', date: '2024-01-15', valeur: 7.2 },
        { coordonnees: ['DEPT-84', 'OP-SFR'], date: '2024-01-15', valeur: 3 },
      ],
    })
  })
})

describe('versItemBatch', () => {
  it('garde la forme historique quand la ligne n’a pas de coordonnées', () => {
    expect(versItemBatch({ individu: 'DEPT-84', date: '2024-01-15', valeur: 1 })).toStrictEqual({
      individu: 'DEPT-84',
      date: '2024-01-15',
      valeur: 1,
    })
  })
})
