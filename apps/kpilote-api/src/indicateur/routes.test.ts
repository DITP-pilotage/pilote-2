import { type ValidationErrorApiModel } from '@pilote/kpilote-shared/error'
import { type IndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { type ResultAsync } from 'neverthrow'
import { OpenAPIHono } from '@hono/zod-openapi'
import { describe, expect, it, vi } from 'vitest'

import { registerErrorHandler } from '@/framework/errors/errorHandler'
import { ApiKeyRole } from '@/generated/prisma/enums'
import { indicateurRoutes } from '@/indicateur/routes'
import { buildTestApp } from '@/test/buildTestApp'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testApiKeyRawKey, testAxeId, testIndicateurNumericId } from '@/test/randomIds'
import { runAsUser } from '@/test/runAsPrincipal'

// La route ouvre sa propre transaction (`withTransaction`), qui ne verrait pas les
// fixtures de la transaction de test : ici elle rejoint la transaction courante
// (celle d'`integrationTest`, annulée en fin de test). Même patron que
// valeurAvancement/routes.test.ts.
vi.mock('@/framework/persistence/withTransaction', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/framework/persistence/withTransaction')>()
  const { db } = await import('@/framework/persistence/dbStore')
  return {
    ...original,
    withTransaction: <T, E>(fn: () => ResultAsync<T, E>): ResultAsync<T, E> => {
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
  sensSouhaite: 'HAUSSE' as const,
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
})

describe.concurrent('PUT /indicateurs/{id} : validation', () => {
  it(
    'refuse un body sans sens souhaité',
    integrationTest(async () => {
      const cle = await cleAdmin()
      const { sensSouhaite: _sensSouhaite, ...bodySansSens } = BODY_BASE

      const response = await put(cle, testIndicateurNumericId(), bodySansSens)

      expect(response.status).toBe(400)
      const body = (await response.json()) as ValidationErrorApiModel
      expect(body.details.issues.map((issue) => issue.path)).toEqual([['sensSouhaite']])
    }),
  )
})

// Les épingles appartiennent à un utilisateur : l'app de test le pose dans le
// contexte, comme le ferait la session.
const appAsUser = (utilisateurId: string) => {
  const app = new OpenAPIHono()
  app.use('*', (_context, next) => runAsUser(utilisateurId, next))
  app.route('/', indicateurRoutes)
  registerErrorHandler(app)
  return app
}

describe.concurrent('PUT et DELETE /indicateurs/:id/epingle', () => {
  it(
    'épingle puis désépingle un indicateur, en 204',
    integrationTest(async () => {
      const indicateurId = testIndicateurNumericId()
      await fixtures.indicateur({ publicId: indicateurId, visibilite: 'PUBLIC' })
      const utilisateur = await fixtures.utilisateur()
      const app = appAsUser(utilisateur.id)
      const epingles = async () => {
        const response = await app.request('/indicateurs?epingle=true')
        const body = (await response.json()) as { items: IndicateurApiModel[] }
        return body.items.map((item) => item.id)
      }

      const pin = await app.request(`/indicateurs/${indicateurId}/epingle`, { method: 'PUT' })
      expect(pin.status).toBe(204)
      expect(await epingles()).toEqual([indicateurId])

      const unpin = await app.request(`/indicateurs/${indicateurId}/epingle`, { method: 'DELETE' })
      expect(unpin.status).toBe(204)
      expect(await epingles()).toEqual([])
    }),
  )

  it(
    'répond 409 au-delà de la limite d’épingles',
    integrationTest(async () => {
      const epingles = Array.from({ length: 20 }, () => testIndicateurNumericId())
      const enTrop = testIndicateurNumericId()
      const utilisateur = await fixtures.utilisateur()
      for (const publicId of epingles) {
        await fixtures.indicateurEpingle({
          indicateur: { publicId, visibilite: 'PUBLIC' },
          utilisateur: { email: utilisateur.email },
        })
      }
      await fixtures.indicateur({ publicId: enTrop, visibilite: 'PUBLIC' })

      const response = await appAsUser(utilisateur.id).request(`/indicateurs/${enTrop}/epingle`, {
        method: 'PUT',
      })

      expect(response.status).toBe(409)
      expect(await response.json()).toMatchObject({
        code: 'LIMITE_EPINGLES_ATTEINTE',
        details: { limite: 20 },
      })
    }),
  )

  it(
    'répond 404 sur un indicateur que l’utilisateur ne peut pas lire',
    integrationTest(async () => {
      const prive = testIndicateurNumericId()
      await fixtures.indicateur({ publicId: prive, visibilite: 'PRIVE' })
      const utilisateur = await fixtures.utilisateur()

      const response = await appAsUser(utilisateur.id).request(`/indicateurs/${prive}/epingle`, {
        method: 'PUT',
      })

      expect(response.status).toBe(404)
    }),
  )
})
