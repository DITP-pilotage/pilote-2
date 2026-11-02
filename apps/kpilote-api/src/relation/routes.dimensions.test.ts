import { describe, expect, it, vi } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { relationRoutes } from '@/relation/routes'
import { buildTestApp } from '@/test/buildTestApp'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testApiKeyRawKey, testCollectionNumericId, testDeptId, testRegId } from '@/test/randomIds'

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

// Garde des relations sur les dimensions (cf. dimensions-design.md §5.1 et
// §4 tour 3) : une hiérarchie vit dans une dimension ; une relation ne doit pas
// rendre agrégée une cellule qui porte des faits.

const buildApp = () => buildTestApp(relationRoutes)

const rattacher = (enfant: string, parent: string, rawKey: string) =>
  buildApp().request(`/relations/${enfant}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${rawKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ parent }),
  })

const admin = async () => {
  const rawKey = testApiKeyRawKey()
  await fixtures.apiKey({ rawKey, role: 'ADMIN' })
  return rawKey
}

// Commune (nouveau niveau de la dimension Territoire, sans parent).
const commune = async () => {
  const publicId = `COM-${testRegId().slice('REG-'.length)}`
  await fixtures.individu({
    publicId,
    referentiel: { publicId: `REF-${testRegId().slice('REG-'.length)}` },
  })
  return publicId
}

describe.concurrent('PUT /relations/{id} — dimensions', () => {
  it(
    'DIMENSIONS_DIFFERENTES (400) : un opérateur ne peut pas avoir un territoire pour parent',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const rawKey = await admin()

      const response = await rattacher(cube.orange, cube.deptA, rawKey)

      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({ code: 'DIMENSIONS_DIFFERENTES' })
      expect(await db().relation.count({ where: { child: { publicId: cube.orange } } })).toBe(0)
    }),
  )

  it(
    'FAITS_MASQUES (409) : le parent porte des faits sur un indicateur multi-dimension où il agrège',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      await fixtures.valeurAvancement({
        indicateur: { publicId: cube.indicateur },
        individus: [{ publicId: cube.deptA }, { publicId: cube.orange }],
      })
      const enfant = await commune()
      const rawKey = await admin()

      const response = await rattacher(enfant, cube.deptA, rawKey)

      expect(response.status).toBe(409)
      expect(await response.json()).toMatchObject({ code: 'FAITS_MASQUES' })
    }),
  )

  it(
    'FAITS_MASQUES (409) : le parent est d’un niveau non déclaré, son ancêtre déclaré porte des faits',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      await fixtures.valeurAvancement({
        indicateur: { publicId: cube.indicateur },
        individus: [{ publicId: cube.deptA }, { publicId: cube.orange }],
      })
      // Canton (niveau non déclaré par l'indicateur) sous DEPT-A.
      const canton = await commune()
      await fixtures.relation({ parent: { publicId: cube.deptA }, child: { publicId: canton } })
      const enfant = await commune()
      const rawKey = await admin()

      const response = await rattacher(enfant, canton, rawKey)

      expect(response.status).toBe(409)
      expect(await response.json()).toMatchObject({ code: 'FAITS_MASQUES' })
    }),
  )

  it(
    'accepte la relation quand le parent ne porte pas de faits (DEPT-B)',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      await fixtures.valeurAvancement({
        indicateur: { publicId: cube.indicateur },
        individus: [{ publicId: cube.deptA }, { publicId: cube.orange }],
      })
      const enfant = await commune()
      const rawKey = await admin()

      const response = await rattacher(enfant, cube.deptB, rawKey)

      expect(response.status).toBe(200)
    }),
  )

  it(
    'mono-dimension inchangé : un parent à faits peut recevoir un enfant (D6)',
    integrationTest(async () => {
      const indId = `IND-${testCollectionNumericId().slice('COL-'.length)}`
      const refDept = `REF-${testRegId().slice('REG-'.length)}`
      const dept = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refDept },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: dept, referentiel: { publicId: refDept } },
      })
      const enfant = await commune()
      const rawKey = await admin()

      const response = await rattacher(enfant, dept, rawKey)

      expect(response.status).toBe(200)
    }),
  )
})
