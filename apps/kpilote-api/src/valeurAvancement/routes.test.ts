import { describe, expect, it, vi } from 'vitest'

import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { buildTestApp } from '@/test/buildTestApp'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testApiKeyRawKey, testCollectionNumericId, testDeptIds, testRegId } from '@/test/randomIds'
import { valeurAvancementRoutes } from '@/valeurAvancement/routes'

// Les routes d'écriture ouvrent leur propre transaction, qui ne verrait pas les
// fixtures de la transaction de test : ici elles rejoignent la transaction
// courante quand il y en a une (celle d'`integrationTest`, annulée en fin de
// test). Hors contexte de base, comportement d'origine.
vi.mock('@/framework/persistence/withTransaction', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/framework/persistence/withTransaction')>()
  const { db } = await import('@/framework/persistence/dbStore')
  return {
    withTransaction: <T>(fn: () => Promise<T>): Promise<T> => {
      try {
        db()
      } catch {
        return original.withTransaction(fn)
      }
      return fn()
    },
  }
})

const buildApp = () => buildTestApp(valeurAvancementRoutes)

const indicateurId = () => `IND-${testCollectionNumericId().slice('COL-'.length)}`

const put = (path: string, rawKey: string, body: unknown) =>
  buildApp().request(path, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${rawKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

// Rejoue exactement le client pilote-ppg (`apps/pilote-ppg/src/server/mb-sync` :
// `HttpMbApiClient.upsertValeursAvancementBatch`, items produits par
// `SyncMbValeursUseCase`) : `{ items: [{ individu, date, valeur }] }`, forme
// historique sur un indicateur mono-dimension.
describe.concurrent('PUT /indicateurs/{id}/valeurs:batch — rétrocompatibilité pilote-ppg', () => {
  const indicateurMono = async () => {
    const indId = indicateurId()
    const refDept = `REF-${testRegId().slice('REG-'.length)}`
    const [dept1, dept2] = testDeptIds(2)
    await fixtures.indicateurReferentiel({
      indicateur: { publicId: indId },
      referentiel: { publicId: refDept },
      fonctionAgregation: 'NONE',
    })
    await fixtures.individu(
      { publicId: dept1, referentiel: { publicId: refDept } },
      { publicId: dept2, referentiel: { publicId: refDept } },
    )
    const rawKey = testApiKeyRawKey()
    await fixtures.apiKey({
      rawKey,
      role: 'ADMIN',
      permissions: [
        { indicateur: { publicId: indId }, action: IndicateurPermissionAction.READ },
        { indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_DATA },
      ],
    })
    return { indId, dept1, dept2, rawKey }
  }

  it(
    'compte les créations puis les mises à jour, comme avant les dimensions',
    integrationTest(async () => {
      const { indId, dept1, dept2, rawKey } = await indicateurMono()

      const premier = await put(`/indicateurs/${indId}/valeurs:batch`, rawKey, {
        items: [
          { individu: dept1, date: '2025-01-01', valeur: 12.5 },
          { individu: dept2, date: '2025-01-01', valeur: 30 },
          { individu: dept1, date: '2025-02-01', valeur: 13 },
        ],
      })
      const second = await put(`/indicateurs/${indId}/valeurs:batch`, rawKey, {
        items: [
          { individu: dept1, date: '2025-01-01', valeur: 12.75 },
          { individu: dept2, date: '2025-01-01', valeur: 30 },
          { individu: dept2, date: '2025-02-01', valeur: 31 },
        ],
      })

      expect(premier.status).toBe(200)
      expect(await premier.json()).toEqual({ total: 3, created: 3, updated: 0 })
      expect(second.status).toBe(200)
      expect(await second.json()).toEqual({ total: 3, created: 1, updated: 2 })
    }),
  )

  it(
    'garde exactement les erreurs historiques (DUPLICATE_KEY + INDIVIDU_INCONNU sur la chaîne brute)',
    integrationTest(async () => {
      const { indId, dept1, rawKey } = await indicateurMono()

      const response = await put(`/indicateurs/${indId}/valeurs:batch`, rawKey, {
        items: [
          { individu: dept1, date: '2025-01-01', valeur: 1 },
          { individu: 'DEPT-INCONNU', date: '2025-01-01', valeur: 2 },
          { individu: dept1, date: '2025-01-01', valeur: 3 },
          { individu: 'DEPT-INCONNU', date: '2025-01-01', valeur: 4 },
        ],
      })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        code: 'BATCH_INVALID',
        message: "Aucune valeur n'a été appliquée.",
        details: {
          errors: [
            { code: 'DUPLICATE_KEY', indices: [0, 2], individu: dept1, date: '2025-01-01' },
            {
              code: 'DUPLICATE_KEY',
              indices: [1, 3],
              individu: 'DEPT-INCONNU',
              date: '2025-01-01',
            },
            { code: 'INDIVIDU_INCONNU', indices: [1, 3], individu: 'DEPT-INCONNU' },
          ],
        },
      })
    }),
  )

  it(
    'mélange `individu` / `coordonnees` sur la même cellule : 400 BATCH_INVALID, pas 500',
    integrationTest(async () => {
      const { indId, dept1, rawKey } = await indicateurMono()

      const response = await put(`/indicateurs/${indId}/valeurs:batch`, rawKey, {
        items: [
          { individu: dept1, date: '2025-01-01', valeur: 1 },
          { coordonnees: [dept1], date: '2025-01-01', valeur: 2 },
        ],
      })

      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({
        code: 'BATCH_INVALID',
        details: {
          errors: [{ code: 'DUPLICATE_KEY', indices: [0, 1], individu: dept1, date: '2025-01-01' }],
        },
      })
    }),
  )
})

describe.concurrent('PUT /indicateurs/{id}/valeurs — multi-dimension', () => {
  it(
    'principal restreint à OP-ORANGE : 200 sur (DEPT, ORANGE), 403 HORS_PERIMETRE sur (DEPT, SFR)',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const rawKey = testApiKeyRawKey()
      const apiKey = await fixtures.apiKey({
        rawKey,
        permissions: [
          { indicateur: { publicId: cube.indicateur }, action: IndicateurPermissionAction.READ },
        ],
      })
      await fixtures.indicateurPermissionPerimetre({
        principalId: apiKey.id,
        indicateur: { publicId: cube.indicateur },
        membres: [{ publicId: cube.orange }],
      })
      const ecrire = (operateur: string) =>
        put(`/indicateurs/${cube.indicateur}/valeurs`, rawKey, {
          coordonnees: [operateur, cube.deptA],
          date: '2025-01-01',
          valeur: 4,
        })

      const autorise = await ecrire(cube.orange)
      const refuse = await ecrire(cube.sfr)

      expect(autorise.status).toBe(200)
      expect(await autorise.json()).toEqual({
        indicateur: cube.indicateur,
        individu: `${cube.deptA}~${cube.orange}`,
        date: '2025-01-01',
        valeur: 4,
        type: 'saisie',
      })
      expect(refuse.status).toBe(403)
      expect(await refuse.json()).toMatchObject({
        code: 'HORS_PERIMETRE',
        details: { individu: `${cube.deptA}~${cube.sfr}` },
      })
    }),
  )

  it(
    'COORDONNEE_MANQUANTE en 400 sur la forme historique d’un indicateur multi-dimension',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const rawKey = testApiKeyRawKey()
      await fixtures.apiKey({
        rawKey,
        permissions: [
          {
            indicateur: { publicId: cube.indicateur },
            action: IndicateurPermissionAction.WRITE_DATA,
          },
        ],
      })

      const response = await put(`/indicateurs/${cube.indicateur}/valeurs`, rawKey, {
        individu: cube.deptA,
        date: '2025-01-01',
        valeur: 4,
      })

      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({
        code: 'COORDONNEE_MANQUANTE',
        details: { dimension: cube.dimensionOperateur },
      })
    }),
  )
})

describe.concurrent('GET /indicateurs/{id}/valeurs — cellules en paramètre', () => {
  it(
    'accepte `DEPT~OP` et `DEPT` dans `individus` et les distingue',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      for (const [operateur, valeur] of [
        [cube.orange, 10],
        [cube.sfr, 20],
      ] as const) {
        await fixtures.valeurAvancement({
          indicateur: { publicId: cube.indicateur },
          individus: [{ publicId: cube.deptA }, { publicId: operateur }],
          date: '2025-01-01',
          valeur,
        })
      }
      const rawKey = testApiKeyRawKey()
      await fixtures.apiKey({
        rawKey,
        permissions: [
          { indicateur: { publicId: cube.indicateur }, action: IndicateurPermissionAction.READ },
        ],
      })

      const response = await buildApp().request(
        `/indicateurs/${cube.indicateur}/valeurs?individus=${cube.deptA}~${cube.orange},${cube.deptA}`,
        { headers: { Authorization: `Bearer ${rawKey}` } },
      )

      expect(response.status).toBe(200)
      const { items } = (await response.json()) as {
        items: Array<{ individu: string; valeur: number; type: string }>
      }
      expect(items.map(({ individu, valeur, type }) => ({ individu, valeur, type }))).toEqual(
        [
          { individu: `${cube.deptA}~${cube.orange}`, valeur: 10, type: 'saisie' },
          { individu: cube.deptA, valeur: 30, type: 'derivee' },
        ].sort((a, b) => (a.individu < b.individu ? -1 : 1)),
      )
    }),
  )
})
