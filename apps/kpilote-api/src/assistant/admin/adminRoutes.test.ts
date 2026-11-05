import { randomUUID } from 'node:crypto'

import { OpenAPIHono } from '@hono/zod-openapi'
import { describe, expect, it } from 'vitest'

import { assistantAdminRoutes } from '@/assistant/admin/routes'
import { runWithPrincipal, type Principal } from '@/framework/auth/userContext'
import { registerErrorHandler } from '@/framework/errors/errorHandler'
import { db } from '@/framework/persistence/dbStore'
import { ApiKeyRole } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

const admin: Principal = {
  kind: 'apiKey',
  apiKey: { id: randomUUID(), label: 'admin', role: ApiKeyRole.ADMIN },
}

const appAs = (principal: Principal) => {
  const app = new OpenAPIHono()
  app.use('*', (_context, next) => runWithPrincipal(principal, next))
  app.route('/', assistantAdminRoutes)
  registerErrorHandler(app)
  return app
}

const json = (method: string, body: unknown) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

type Appel = Partial<{
  evaluation: 'POSITIVE' | 'NEGATIVE'
  categoriesProbleme: Array<'PROBLEME_TECHNIQUE' | 'INCOMPREHENSION' | 'SUGGESTION' | 'AUTRE'>
  commentaire: string
}>

const givenConversation = async (titre: string, appels: Appel[] = [], updatedAt = new Date()) => {
  const principalId = randomUUID()
  const conversation = await db().assistantConversation.create({
    data: {
      id: randomUUID(),
      principalId,
      titre,
      messages: [{ id: 'm', role: 'user', parts: [{ type: 'text', text: titre }] }],
      updatedAt,
    },
  })
  for (const [index, appel] of appels.entries()) {
    await db().assistantAppel.create({
      data: {
        conversationId: conversation.id,
        principalId,
        modele: 'albert-large',
        transcript: {},
        createdAt: new Date(2026, 0, 1, 0, index),
        ...appel,
      },
    })
  }
  return conversation
}

type ListBody = {
  items: Array<{
    titre: string
    tours: number
    positifs: number
    negatifs: number
    commentaires: number
  }>
  total: number
}

const list = async (query = '') => {
  const response = await appAs(admin).request(`/assistant/admin/conversations${query}`)
  expect(response.status).toBe(200)
  return (await response.json()) as ListBody
}

describe('administration de l’assistant', { concurrent: false }, () => {
  describe('accès', () => {
    it(
      'ouvre et coupe l’assistant',
      integrationTest(async () => {
        const app = appAs(admin)

        const ouvert = await app.request(
          '/assistant/admin/acces/actif',
          json('PUT', { actif: true }),
        )
        expect(ouvert.status).toBe(200)
        expect(await ouvert.json()).toMatchObject({ actif: true })

        await app.request('/assistant/admin/acces/actif', json('PUT', { actif: false }))
        const lu = await app.request('/assistant/admin/acces')
        expect(await lu.json()).toMatchObject({ actif: false })
      }),
    )

    it(
      'autorise puis retire un utilisateur',
      integrationTest(async () => {
        const utilisateur = await fixtures.utilisateur({ email: `${randomUUID()}@acces.fr` })
        const app = appAs(admin)
        const path = `/assistant/admin/acces/utilisateurs/${utilisateur.id}`

        const ajoute = await app.request(path, { method: 'PUT' })
        expect(ajoute.status).toBe(200)
        const body = (await ajoute.json()) as { utilisateurs: Array<{ email: string }> }
        expect(body.utilisateurs.map((u) => u.email)).toContain(utilisateur.email)

        const encore = await app.request(path, { method: 'PUT' })
        expect(encore.status).toBe(200)

        const retire = await app.request(path, { method: 'DELETE' })
        const apres = (await retire.json()) as { utilisateurs: Array<{ email: string }> }
        expect(apres.utilisateurs.map((u) => u.email)).not.toContain(utilisateur.email)
      }),
    )

    it(
      'refuse d’autoriser un utilisateur inconnu',
      integrationTest(async () => {
        const response = await appAs(admin).request(
          `/assistant/admin/acces/utilisateurs/${randomUUID()}`,
          { method: 'PUT' },
        )
        expect(response.status).toBe(404)
      }),
    )
  })

  describe('conversations', () => {
    it(
      'liste les conversations, des plus récentes aux plus anciennes, avec leurs retours',
      integrationTest(async () => {
        const marque = randomUUID()
        await givenConversation(`${marque} ancienne`, [], new Date('2026-01-01'))
        await givenConversation(
          `${marque} récente`,
          [
            { evaluation: 'POSITIVE', commentaire: 'Parfait' },
            { evaluation: 'NEGATIVE', categoriesProbleme: ['INCOMPREHENSION'] },
            {},
          ],
          new Date('2026-06-01'),
        )

        const body = await list(`?recherche=${marque}`)

        expect(body.total).toBe(2)
        expect(body.items).toEqual([
          expect.objectContaining({
            titre: `${marque} récente`,
            tours: 3,
            positifs: 1,
            negatifs: 1,
            commentaires: 1,
          }),
          expect.objectContaining({
            titre: `${marque} ancienne`,
            tours: 0,
            positifs: 0,
            negatifs: 0,
            commentaires: 0,
          }),
        ])
      }),
    )

    it(
      'filtre par évaluation, commentaire et catégorie',
      integrationTest(async () => {
        const marque = randomUUID()
        await givenConversation(`${marque} positive`, [{ evaluation: 'POSITIVE' }])
        await givenConversation(`${marque} négative`, [
          { evaluation: 'NEGATIVE', categoriesProbleme: ['SUGGESTION'], commentaire: 'Idée' },
        ])
        await givenConversation(`${marque} muette`, [{}])

        const titres = async (filtre: string) =>
          (await list(`?recherche=${marque}&${filtre}`)).items.map((item) => item.titre)

        expect(await titres('positif=true')).toEqual([`${marque} positive`])
        expect(await titres('negatif=true')).toEqual([`${marque} négative`])
        expect(await titres('commentaire=true')).toEqual([`${marque} négative`])
        expect(await titres('categorie=SUGGESTION')).toEqual([`${marque} négative`])
        expect(await titres('categorie=AUTRE')).toEqual([])
      }),
    )

    it(
      'pagine par 25',
      integrationTest(async () => {
        const marque = randomUUID()
        for (let index = 0; index < 26; index++) {
          await givenConversation(`${marque} ${index}`, [], new Date(2026, 0, 1, 0, index))
        }

        const premiere = await list(`?recherche=${marque}`)
        const seconde = await list(`?recherche=${marque}&page=2`)
        const audela = await list(`?recherche=${marque}&page=5`)

        expect(premiere.items).toHaveLength(25)
        expect(premiere.total).toBe(26)
        expect(seconde.items.map((item) => item.titre)).toEqual([`${marque} 0`])
        expect(audela.items).toEqual([])
        expect(audela.total).toBe(26)
      }),
    )

    it(
      'rend une conversation avec ses appels dans l’ordre, sans l’identité de son auteur',
      integrationTest(async () => {
        const conversation = await givenConversation('Détail', [
          { evaluation: 'NEGATIVE', categoriesProbleme: ['AUTRE'], commentaire: 'Faux' },
          {},
        ])

        const response = await appAs(admin).request(
          `/assistant/admin/conversations/${conversation.id}`,
        )

        expect(response.status).toBe(200)
        const body = (await response.json()) as Record<string, unknown> & {
          appels: Array<Record<string, unknown>>
        }
        expect(body.titre).toBe('Détail')
        expect(body.messages).toHaveLength(1)
        expect(body.appels.map((appel) => appel.evaluation)).toEqual(['NEGATIVE', null])
        expect(body.appels[0]).toMatchObject({ categories: ['AUTRE'], commentaire: 'Faux' })
        expect(JSON.stringify(body)).not.toContain(conversation.principalId)
      }),
    )

    it(
      'rend 404 pour une conversation inconnue',
      integrationTest(async () => {
        const response = await appAs(admin).request(
          `/assistant/admin/conversations/${randomUUID()}`,
        )
        expect(response.status).toBe(404)
      }),
    )
  })

  it(
    'est réservée aux clés API ADMIN',
    integrationTest(async () => {
      const contributeur: Principal = {
        kind: 'apiKey',
        apiKey: { id: randomUUID(), label: 'contrib', role: ApiKeyRole.CONTRIBUTOR },
      }
      const utilisateur = await fixtures.assistantUtilisateur()
      const humain: Principal = {
        kind: 'user',
        user: { id: utilisateur.id, email: utilisateur.email, prenom: 'A', nom: 'B' },
      }

      for (const principal of [contributeur, humain]) {
        const app = appAs(principal)
        expect((await app.request('/assistant/admin/acces')).status).toBe(403)
        expect((await app.request('/assistant/admin/conversations')).status).toBe(403)
        expect(
          (await app.request('/assistant/admin/acces/actif', json('PUT', { actif: true }))).status,
        ).toBe(403)
      }
    }),
  )
})
