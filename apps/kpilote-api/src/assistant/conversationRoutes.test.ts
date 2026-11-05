import { randomUUID } from 'node:crypto'

import { OpenAPIHono } from '@hono/zod-openapi'
import { describe, expect, it } from 'vitest'

import { assistantRoutes } from '@/assistant/routes'
import { runWithPrincipal, type Principal } from '@/framework/auth/userContext'
import { registerErrorHandler } from '@/framework/errors/errorHandler'
import { db } from '@/framework/persistence/dbStore'
import { ApiKeyRole } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

const userPrincipal = (id: string): Principal => ({
  kind: 'user',
  user: { id, email: 'agent@example.fr', prenom: 'Agent', nom: 'Test' },
})

// Un utilisateur autorisé à se servir de l'assistant.
const authorizedId = async () => (await fixtures.assistantUtilisateur()).id

const appAs = (principal: Principal) => {
  const app = new OpenAPIHono()
  app.use('*', (_context, next) => runWithPrincipal(principal, next))
  app.route('/', assistantRoutes)
  registerErrorHandler(app)
  return app
}

const givenConversation = (principalId: string, titre: string, updatedAt = new Date()) =>
  db().assistantConversation.create({
    data: {
      id: randomUUID(),
      principalId,
      titre,
      messages: [{ id: 'm', role: 'user', parts: [{ type: 'text', text: titre }] }],
      updatedAt,
    },
  })

describe('conversations de l’assistant', { concurrent: false }, () => {
  it(
    'liste les seules conversations du principal, des plus récentes aux plus anciennes',
    integrationTest(async () => {
      const principalId = await authorizedId()
      await givenConversation(principalId, 'Ancienne', new Date('2026-01-01'))
      await givenConversation(principalId, 'Récente', new Date('2026-06-01'))
      await givenConversation(randomUUID(), 'D’un autre')

      const response = await appAs(userPrincipal(principalId)).request('/assistant/conversations')

      expect(response.status).toBe(200)
      const body = (await response.json()) as { items: Array<{ titre: string }> }
      expect(body.items.map((item) => item.titre)).toEqual(['Récente', 'Ancienne'])
      expect(body.items[0]).not.toHaveProperty('messages')
    }),
  )

  it(
    'ne liste que les 50 plus récentes',
    integrationTest(async () => {
      const principalId = await authorizedId()
      await db().assistantConversation.createMany({
        data: Array.from({ length: 51 }, (_, index) => ({
          id: randomUUID(),
          principalId,
          titre: `Conversation ${index}`,
          messages: [],
          updatedAt: new Date(2026, 0, 1, 0, index),
        })),
      })

      const response = await appAs(userPrincipal(principalId)).request('/assistant/conversations')
      const body = (await response.json()) as { items: Array<{ titre: string }> }

      expect(body.items).toHaveLength(50)
      expect(body.items.at(-1)?.titre).toBe('Conversation 1')
    }),
  )

  it(
    'rend une conversation du principal avec ses messages',
    integrationTest(async () => {
      const principalId = await authorizedId()
      const conversation = await givenConversation(principalId, 'Chômage')

      const response = await appAs(userPrincipal(principalId)).request(
        `/assistant/conversations/${conversation.id}`,
      )

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(
        expect.objectContaining({
          id: conversation.id,
          titre: 'Chômage',
          messages: [expect.any(Object)],
        }),
      )
    }),
  )

  it(
    'ne montre ni ne supprime la conversation d’un autre principal',
    integrationTest(async () => {
      const conversation = await givenConversation(randomUUID(), 'Privée')
      const intrus = appAs(userPrincipal(await authorizedId()))

      expect((await intrus.request(`/assistant/conversations/${conversation.id}`)).status).toBe(404)
      expect(
        (await intrus.request(`/assistant/conversations/${conversation.id}`, { method: 'DELETE' }))
          .status,
      ).toBe(404)
      expect(
        await db().assistantConversation.findUnique({ where: { id: conversation.id } }),
      ).not.toBeNull()
    }),
  )

  it(
    'supprime une conversation du principal',
    integrationTest(async () => {
      const principalId = await authorizedId()
      const conversation = await givenConversation(principalId, 'À supprimer')
      const app = appAs(userPrincipal(principalId))

      const deleted = await app.request(`/assistant/conversations/${conversation.id}`, {
        method: 'DELETE',
      })

      expect(deleted.status).toBe(204)
      expect((await app.request(`/assistant/conversations/${conversation.id}`)).status).toBe(404)
    }),
  )

  it(
    'refuse une clé API',
    integrationTest(async () => {
      const app = appAs({
        kind: 'apiKey',
        apiKey: { id: randomUUID(), label: 'cle', role: ApiKeyRole.ADMIN },
      })
      expect((await app.request('/assistant/conversations')).status).toBe(403)
    }),
  )
})
