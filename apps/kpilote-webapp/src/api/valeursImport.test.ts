import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { importValeursBatch, ImportBatchInvalidError } from '@/api/valeursImport'
import { apiUrl, server } from '@/tests/server'

describe('importValeursBatch', () => {
  it('retourne le résultat en cas de succès', async () => {
    server.use(
      http.put(apiUrl('/indicateurs/IND-1/valeurs:batch'), () =>
        HttpResponse.json({ total: 2, created: 1, updated: 1 }),
      ),
    )
    const result = await importValeursBatch({
      indicateurId: 'IND-1',
      rows: [{ individu: 'DEPT-84', date: '2024-01-15', valeur: 7.2 }],
    })
    expect(result).toEqual({ total: 2, created: 1, updated: 1 })
  })

  it('lève ImportBatchInvalidError avec les détails sur 400 BATCH_INVALID', async () => {
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
    await expect(
      importValeursBatch({
        indicateurId: 'IND-1',
        rows: [{ individu: 'DEPT-99', date: '2024-01-15', valeur: 7.2 }],
      }),
    ).rejects.toBeInstanceOf(ImportBatchInvalidError)
  })
})
