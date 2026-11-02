import { describe, expect, it, vi } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { indicateurRoutes } from '@/indicateur/routes'
import { buildTestApp } from '@/test/buildTestApp'
import { DIMENSION_TEST_PAR_DEFAUT, fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testApiKeyRawKey, testCollectionNumericId } from '@/test/randomIds'

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

const buildApp = () => buildTestApp(indicateurRoutes)

const indicateurId = () => `IND-${testCollectionNumericId().slice('COL-'.length)}`

const put = (indId: string, rawKey: string, body: unknown) =>
  buildApp().request(`/indicateurs/${indId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${rawKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const niveaux = async (publicId: string) =>
  (
    await db().indicateurReferentiel.findMany({
      where: { indicateur: { publicId } },
      include: { referentiel: true },
    })
  )
    .map((n) => ({ id: n.referentiel.publicId, fonctionAgregation: n.fonctionAgregation }))
    .sort((a, b) => a.id.localeCompare(b.id))

// Rejoue exactement le client pilote-ppg (`apps/pilote-ppg/src/server/mb-sync` :
// `HttpMbApiClient.upsertIndicateur`, payload de `SyncMbMetadonneesUseCase`) :
// `{ nom, visibilite: 'PUBLIC', unite, referentiels: [{ id: REF-NAT|REF-REG|REF-DEPT,
// fonctionAgregation: 'NONE' }] }`. Référentiels aux identifiants fixes : tests
// séquentiels (pas de contention sur leur unicité).
describe('PUT /indicateurs/{id} — rétrocompatibilité pilote-ppg', () => {
  const referentielsPpg = async () => {
    await fixtures.referentiel(
      { publicId: 'REF-NAT' },
      { publicId: 'REF-REG' },
      { publicId: 'REF-DEPT' },
    )
  }
  const payloadPpg = (mailles: string[]) => ({
    nom: 'Taux de réussite',
    visibilite: 'PUBLIC',
    unite: 'POURCENTAGE',
    referentiels: mailles.map((id) => ({ id, fonctionAgregation: 'NONE' })),
  })

  it(
    'création : niveaux posés, une seule dimension configurée par défaut',
    integrationTest(async () => {
      await referentielsPpg()
      const indId = indicateurId()
      const rawKey = testApiKeyRawKey()
      await fixtures.apiKey({ rawKey, role: 'ADMIN' })

      const response = await put(indId, rawKey, payloadPpg(['REF-NAT', 'REF-REG', 'REF-DEPT']))

      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({
        id: indId,
        referentiels: [
          { id: 'REF-DEPT', fonctionAgregation: 'NONE' },
          { id: 'REF-NAT', fonctionAgregation: 'NONE' },
          { id: 'REF-REG', fonctionAgregation: 'NONE' },
        ],
        dimensions: [
          {
            id: DIMENSION_TEST_PAR_DEFAUT,
            ordre: 0,
            fonctionAgregation: 'SUM',
            porteObjectifs: true,
            referentiels: ['REF-DEPT', 'REF-NAT', 'REF-REG'],
          },
        ],
      })
    }),
  )

  it(
    'mise à jour mono : replace-all exact des niveaux (retraits compris), valeurs conservées',
    integrationTest(async () => {
      await referentielsPpg()
      const indId = indicateurId()
      await fixtures.indicateurReferentiel(
        { indicateur: { publicId: indId }, referentiel: { publicId: 'REF-NAT' } },
        {
          indicateur: { publicId: indId },
          referentiel: { publicId: 'REF-REG' },
          fonctionAgregation: 'AVG',
        },
        { indicateur: { publicId: indId }, referentiel: { publicId: 'REF-DEPT' } },
      )
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: 'DEPT-PPG-01', referentiel: { publicId: 'REF-DEPT' } },
      })
      const rawKey = testApiKeyRawKey()
      await fixtures.apiKey({
        rawKey,
        role: 'ADMIN',
        permissions: [
          { indicateur: { publicId: indId }, action: IndicateurPermissionAction.WRITE_DATA },
        ],
      })

      const response = await put(indId, rawKey, payloadPpg(['REF-NAT', 'REF-DEPT']))

      expect(response.status).toBe(200)
      expect(await niveaux(indId)).toEqual([
        { id: 'REF-DEPT', fonctionAgregation: 'NONE' },
        { id: 'REF-NAT', fonctionAgregation: 'NONE' },
      ])
      expect(
        await db().valeurAvancement.count({ where: { indicateur: { publicId: indId } } }),
      ).toBe(1)
    }),
  )
})

describe.concurrent('PUT /indicateurs/{id} — multi-dimension', () => {
  it(
    'passage en multi sans `dimensions` : 400 VALIDATION_ERROR',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      await db().indicateurDimension.deleteMany({
        where: { indicateur: { publicId: cube.indicateur } },
      })
      await db().indicateurReferentiel.deleteMany({
        where: { indicateur: { publicId: cube.indicateur }, referentiel: { publicId: cube.refOp } },
      })
      const rawKey = testApiKeyRawKey()
      await fixtures.apiKey({
        rawKey,
        role: 'ADMIN',
        permissions: [
          {
            indicateur: { publicId: cube.indicateur },
            action: IndicateurPermissionAction.WRITE_DATA,
          },
        ],
      })

      const response = await put(cube.indicateur, rawKey, {
        nom: 'Indicateur croisé',
        visibilite: 'PRIVE',
        unite: null,
        referentiels: [
          { id: cube.refDept, fonctionAgregation: 'SUM' },
          { id: cube.refOp, fonctionAgregation: 'NONE' },
        ],
      })

      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({ code: 'VALIDATION_ERROR' })
    }),
  )

  it(
    'principal au périmètre restreint : 403',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const rawKey = testApiKeyRawKey()
      const apiKey = await fixtures.apiKey({ rawKey, role: 'ADMIN' })
      await fixtures.indicateurPermissionPerimetre({
        principalId: apiKey.id,
        indicateur: { publicId: cube.indicateur },
        membres: [{ publicId: cube.orange }],
      })

      const response = await put(cube.indicateur, rawKey, {
        nom: 'Indicateur croisé',
        visibilite: 'PRIVE',
        unite: null,
        referentiels: [{ id: cube.refDept, fonctionAgregation: 'SUM' }],
      })

      expect(response.status).toBe(403)
    }),
  )
})
