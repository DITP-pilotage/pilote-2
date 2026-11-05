import { randomUUID } from 'node:crypto'

import { OpenAPIHono } from '@hono/zod-openapi'
import { describe, expect, it, vi } from 'vitest'

import { analyticsRoutes } from '@/analytics/routes'
import { runWithPrincipal, type Principal } from '@/framework/auth/userContext'
import { registerErrorHandler } from '@/framework/errors/errorHandler'
import { db } from '@/framework/persistence/dbStore'
import { ApiKeyRole } from '@/generated/prisma/enums'
import { integrationTest } from '@/test/integrationTest'

const admin: Principal = {
  kind: 'apiKey',
  apiKey: { id: randomUUID(), label: 'admin', role: ApiKeyRole.ADMIN },
}
const contributeur: Principal = {
  kind: 'apiKey',
  apiKey: { id: randomUUID(), label: 'contrib', role: ApiKeyRole.CONTRIBUTOR },
}

const appAs = (principal: Principal | null) => {
  const app = new OpenAPIHono()
  app.use('*', (_context, next) => runWithPrincipal(principal, next))
  app.route('/', analyticsRoutes)
  registerErrorHandler(app)
  return app
}

const put = (cle: string, body: unknown) => ({
  path: `/analytics/dimensions/${cle}`,
  init: {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  },
})

const putAs = (principal: Principal, cle: string, body: unknown) => {
  const { path, init } = put(cle, body)
  return appAs(principal).request(path, init)
}

describe('dimensions Matomo', { concurrent: false }, () => {
  it(
    'se lisent sans être connecté, triées par numéro',
    integrationTest(async () => {
      await db().analyticsDimension.deleteMany()
      await db().analyticsDimension.createMany({
        data: [
          { cle: 'conversation_id', slot: 4, nom: 'Conversation' },
          { cle: 'app_area', slot: 1, nom: 'Zone' },
        ],
      })

      const response = await appAs(null).request('/analytics/dimensions')

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual([
        { cle: 'app_area', slot: 1, nom: 'Zone' },
        { cle: 'conversation_id', slot: 4, nom: 'Conversation' },
      ])
    }),
  )

  it(
    'se créent puis se modifient',
    integrationTest(async () => {
      await db().analyticsDimension.deleteMany()

      const cree = await putAs(admin, 'entity_id', { slot: 7, nom: 'Entité' })
      expect(cree.status).toBe(200)
      expect(await cree.json()).toEqual({ cle: 'entity_id', slot: 7, nom: 'Entité' })

      const modifie = await putAs(admin, 'entity_id', { slot: 8, nom: 'Entité consultée' })
      expect(await modifie.json()).toEqual({ cle: 'entity_id', slot: 8, nom: 'Entité consultée' })
      expect(await db().analyticsDimension.count()).toBe(1)
    }),
  )

  it(
    'refusent un numéro déjà pris par une autre clé',
    integrationTest(async () => {
      await db().analyticsDimension.deleteMany()
      await db().analyticsDimension.create({ data: { cle: 'app_area', slot: 1, nom: 'Zone' } })

      const response = await putAs(admin, 'entity_id', { slot: 1, nom: 'Entité' })

      expect(response.status).toBe(409)
      expect(
        await db().analyticsDimension.findUnique({ where: { cle: 'app_area' } }),
      ).toMatchObject({ slot: 1 })
    }),
  )

  it(
    'nomment le numéro pris quand une autre clé l’enregistre en même temps',
    integrationTest(async () => {
      await db().analyticsDimension.deleteMany()
      await db().analyticsDimension.create({ data: { cle: 'app_area', slot: 1, nom: 'Zone' } })
      // L'autre enregistrement arrive entre la vérification et l'écriture.
      vi.spyOn(db().analyticsDimension, 'findFirst').mockResolvedValueOnce(null)

      const response = await putAs(admin, 'entity_id', { slot: 1, nom: 'Entité' })

      expect(response.status).toBe(409)
      expect(await response.json()).toMatchObject({
        message: 'La dimension 1 est déjà associée à une autre clé.',
      })
    }),
  )

  it(
    'refusent une clé ou un numéro invalides',
    integrationTest(async () => {
      expect((await putAs(admin, 'Entity-Id', { slot: 1, nom: 'X' })).status).toBe(400)
      expect((await putAs(admin, 'entity_id', { slot: 0, nom: 'X' })).status).toBe(400)
      expect((await putAs(admin, 'entity_id', { slot: 1, nom: ' ' })).status).toBe(400)
    }),
  )

  it(
    'se suppriment, et une clé inconnue rend 404',
    integrationTest(async () => {
      await db().analyticsDimension.deleteMany()
      await db().analyticsDimension.create({ data: { cle: 'app_area', slot: 1, nom: 'Zone' } })
      const app = appAs(admin)

      expect(
        (await app.request('/analytics/dimensions/app_area', { method: 'DELETE' })).status,
      ).toBe(204)
      expect(
        (await app.request('/analytics/dimensions/app_area', { method: 'DELETE' })).status,
      ).toBe(404)
    }),
  )

  it(
    'ne se modifient qu’avec une clé API ADMIN',
    integrationTest(async () => {
      expect((await putAs(contributeur, 'app_area', { slot: 1, nom: 'Zone' })).status).toBe(403)
      expect(
        (await appAs(contributeur).request('/analytics/dimensions/app_area', { method: 'DELETE' }))
          .status,
      ).toBe(403)
      expect(
        (await appAs(null).request('/analytics/dimensions/app_area', { method: 'DELETE' })).status,
      ).toBe(401)
    }),
  )
})
