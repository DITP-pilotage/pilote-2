import { type IndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { describe, expect, it, vi } from 'vitest'

import { ApiKeyRole } from '@/generated/prisma/enums'
import { indicateurRoutes } from '@/indicateur/routes'
import { buildTestApp } from '@/test/buildTestApp'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testApiKeyRawKey, testAxeId, testIndicateurNumericId } from '@/test/randomIds'

// La route ouvre sa propre transaction (`withTransaction`), qui ne verrait pas les
// fixtures de la transaction de test : ici elle rejoint la transaction courante
// (celle d'`integrationTest`, annulée en fin de test). Même patron que
// valeurAvancement/routes.test.ts.
vi.mock('@/framework/persistence/withTransaction', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/framework/persistence/withTransaction')>()
  const { db } = await import('@/framework/persistence/dbStore')
  return {
    ...original,
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

const BODY_BASE = {
  nom: 'Fraudes détectées',
  visibilite: 'PRIVE' as const,
  unite: null,
  referentiels: [],
}

const cleAdmin = async (): Promise<string> => {
  const rawKey = testApiKeyRawKey()
  await fixtures.apiKey({ rawKey, role: ApiKeyRole.ADMIN })
  return rawKey
}

const put = (cle: string, indicateurId: string, body: unknown) =>
  buildApp().request(`/indicateurs/${indicateurId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const get = async (cle: string, indicateurId: string): Promise<IndicateurApiModel> => {
  const response = await buildApp().request(`/indicateurs/${indicateurId}`, {
    headers: { Authorization: `Bearer ${cle}` },
  })
  expect(response.status).toBe(200)
  return (await response.json()) as IndicateurApiModel
}

// Indicateur créé par la clé (qui en reçoit les droits d'écriture) et deux axes.
const contexte = async () => {
  const cle = await cleAdmin()
  const indicateurId = testIndicateurNumericId()
  const operateur = await fixtures.axe({ publicId: testAxeId(), nom: 'Opérateur' })
  const fraude = await fixtures.axe({ publicId: testAxeId(), nom: 'Type de fraude' })
  expect((await put(cle, indicateurId, BODY_BASE)).status).toBe(200)
  return { cle, indicateurId, operateur, fraude }
}

describe.concurrent('PUT /indicateurs/{id} : axes', () => {
  it(
    'déclare les axes dans l’ordre du tableau et les renvoie en lecture',
    integrationTest(async () => {
      const { cle, indicateurId, operateur, fraude } = await contexte()

      const response = await put(cle, indicateurId, {
        ...BODY_BASE,
        axes: [
          { id: fraude.publicId, fonction: 'SUM' },
          { id: operateur.publicId, fonction: 'AVG' },
        ],
      })

      expect(response.status).toBe(200)
      const attendu = [
        { id: fraude.publicId, nom: 'Type de fraude', fonction: 'SUM' },
        { id: operateur.publicId, nom: 'Opérateur', fonction: 'AVG' },
      ]
      expect(((await response.json()) as IndicateurApiModel).axes).toEqual(attendu)
      expect((await get(cle, indicateurId)).axes).toEqual(attendu)
    }),
  )

  it(
    'renvoie `axes: []` pour un indicateur sans axe',
    integrationTest(async () => {
      const { cle, indicateurId } = await contexte()

      expect((await get(cle, indicateurId)).axes).toEqual([])
    }),
  )

  it(
    'laisse les axes inchangés quand le champ est absent',
    integrationTest(async () => {
      const { cle, indicateurId, operateur } = await contexte()
      await put(cle, indicateurId, {
        ...BODY_BASE,
        axes: [{ id: operateur.publicId, fonction: 'SUM' }],
      })

      const response = await put(cle, indicateurId, { ...BODY_BASE, nom: 'Renommé' })

      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({
        nom: 'Renommé',
        axes: [{ id: operateur.publicId, fonction: 'SUM' }],
      })
    }),
  )

  it(
    'retire tous les axes avec `axes: []`',
    integrationTest(async () => {
      const { cle, indicateurId, operateur } = await contexte()
      await put(cle, indicateurId, {
        ...BODY_BASE,
        axes: [{ id: operateur.publicId, fonction: 'SUM' }],
      })

      const response = await put(cle, indicateurId, { ...BODY_BASE, axes: [] })

      expect(response.status).toBe(200)
      expect(((await response.json()) as IndicateurApiModel).axes).toEqual([])
    }),
  )

  it(
    'permet de changer l’ordre et la fonction quand l’indicateur a des valeurs',
    integrationTest(async () => {
      const { cle, indicateurId, operateur, fraude } = await contexte()
      await put(cle, indicateurId, {
        ...BODY_BASE,
        axes: [
          { id: operateur.publicId, fonction: 'SUM' },
          { id: fraude.publicId, fonction: 'SUM' },
        ],
      })
      await fixtures.valeurAvancement({ indicateur: { publicId: indicateurId }, individu: {} })

      const response = await put(cle, indicateurId, {
        ...BODY_BASE,
        axes: [
          { id: fraude.publicId, fonction: 'AVG' },
          { id: operateur.publicId, fonction: 'SUM' },
        ],
      })

      expect(response.status).toBe(200)
      expect(
        ((await response.json()) as IndicateurApiModel).axes.map(({ id, fonction }) => ({
          id,
          fonction,
        })),
      ).toEqual([
        { id: fraude.publicId, fonction: 'AVG' },
        { id: operateur.publicId, fonction: 'SUM' },
      ])
    }),
  )

  it(
    'refuse (409) d’ajouter un axe quand l’indicateur a des valeurs',
    integrationTest(async () => {
      const { cle, indicateurId, operateur } = await contexte()
      await fixtures.valeurAvancement({ indicateur: { publicId: indicateurId }, individu: {} })

      const response = await put(cle, indicateurId, {
        ...BODY_BASE,
        axes: [{ id: operateur.publicId, fonction: 'SUM' }],
      })

      expect(response.status).toBe(409)
      expect(await response.json()).toMatchObject({
        code: 'AXES_VERROUILLES',
        details: { nombreValeurs: 1 },
      })
    }),
  )

  it(
    'refuse (409) de retirer un axe quand l’indicateur a des valeurs',
    integrationTest(async () => {
      const { cle, indicateurId, operateur } = await contexte()
      await put(cle, indicateurId, {
        ...BODY_BASE,
        axes: [{ id: operateur.publicId, fonction: 'SUM' }],
      })
      await fixtures.valeurAvancement({ indicateur: { publicId: indicateurId }, individu: {} })

      const response = await put(cle, indicateurId, { ...BODY_BASE, axes: [] })

      expect(response.status).toBe(409)
      expect(await response.json()).toMatchObject({ code: 'AXES_VERROUILLES' })
    }),
  )

  it(
    'refuse (400) un axe inconnu',
    integrationTest(async () => {
      const { cle, indicateurId } = await contexte()
      const inconnu = testAxeId()

      const response = await put(cle, indicateurId, {
        ...BODY_BASE,
        axes: [{ id: inconnu, fonction: 'SUM' }],
      })

      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({
        code: 'VALIDATION_ERROR',
        details: { unknownAxeIds: [inconnu] },
      })
    }),
  )

  it(
    'refuse (400) un axe déclaré deux fois',
    integrationTest(async () => {
      const { cle, indicateurId, operateur } = await contexte()

      const response = await put(cle, indicateurId, {
        ...BODY_BASE,
        axes: [
          { id: operateur.publicId, fonction: 'SUM' },
          { id: operateur.publicId, fonction: 'AVG' },
        ],
      })

      expect(response.status).toBe(400)
    }),
  )

  it(
    'refuse (400) une fonction autre que SUM ou AVG',
    integrationTest(async () => {
      const { cle, indicateurId, operateur } = await contexte()

      const response = await put(cle, indicateurId, {
        ...BODY_BASE,
        axes: [{ id: operateur.publicId, fonction: 'NONE' }],
      })

      expect(response.status).toBe(400)
    }),
  )

  it(
    'déclare les axes dès la création de l’indicateur',
    integrationTest(async () => {
      const cle = await cleAdmin()
      const indicateurId = testIndicateurNumericId()
      const operateur = await fixtures.axe({ publicId: testAxeId(), nom: 'Opérateur' })

      const response = await put(cle, indicateurId, {
        ...BODY_BASE,
        axes: [{ id: operateur.publicId, fonction: 'AVG' }],
      })

      expect(response.status).toBe(200)
      expect(((await response.json()) as IndicateurApiModel).axes).toEqual([
        { id: operateur.publicId, nom: 'Opérateur', fonction: 'AVG' },
      ])
    }),
  )
})
