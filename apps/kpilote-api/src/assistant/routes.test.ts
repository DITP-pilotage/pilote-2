import { describe, expect, it } from 'vitest'

import { rateResponse } from '@/assistant/commands/rateResponse'
import { assistantRoutes } from '@/assistant/routes'
import { db } from '@/framework/persistence/dbStore'
import { runAsPrincipal } from '@/test/runAsPrincipal'
import { buildTestApp } from '@/test/buildTestApp'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testApiKeyRawKey } from '@/test/randomIds'

const buildApp = () => buildTestApp(assistantRoutes)
const conversationId = '018f3a2b-0000-7000-8000-000000000001'

/**
 * Une clé API valide, rendue en clair pour pouvoir la présenter en Bearer.
 * `fixtures.apiKey` ne rend que la ligne stockée, dont le hash n'est pas rejouable.
 */
const givenApiKey = async (): Promise<string> => {
  const rawKey = testApiKeyRawKey()
  await fixtures.apiKey({ rawKey })
  return rawKey
}

const body = (override: Record<string, unknown> = {}) =>
  JSON.stringify({
    surface: 'ask-libre',
    conversationId,
    messages: [{ id: 'm1', role: 'user', parts: [{ type: 'text', text: 'Bonjour' }] }],
    ...override,
  })

const callChat = (rawKey: string | null, body: string) =>
  buildApp().request('/assistant/chat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(rawKey ? { Authorization: `Bearer ${rawKey}` } : {}),
    },
    body,
  })

describe.concurrent('POST /assistant/chat', () => {
  it(
    'renvoie 401 sans authentification',
    integrationTest(async () => {
      expect((await callChat(null, body())).status).toBe(401)
    }),
  )

  it(
    'renvoie 400 sur une surface que le moteur ne sert pas',
    integrationTest(async () => {
      const rawKey = await givenApiKey()
      expect((await callChat(rawKey, body({ surface: 'ask-entite' }))).status).toBe(400)
    }),
  )

  it(
    "renvoie 400 quand conversationId n'est pas un uuid",
    integrationTest(async () => {
      const rawKey = await givenApiKey()
      expect((await callChat(rawKey, body({ conversationId: 'pas-un-uuid' }))).status).toBe(400)
    }),
  )

  it(
    'renvoie 400 sur un modèle hors liste fermée',
    integrationTest(async () => {
      const rawKey = await givenApiKey()
      expect((await callChat(rawKey, body({ model: 'gpt-4' }))).status).toBe(400)
    }),
  )
})

const rate = (rawKey: string, body: Record<string, unknown>) =>
  buildApp().request(`/assistant/conversations/${conversationId}/evaluation`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${rawKey}` },
    body: JSON.stringify(body),
  })

describe.concurrent('POST /assistant/conversations/{id}/evaluation', () => {
  it(
    'refuse un feedback négatif sans catégorie',
    integrationTest(async () => {
      const rawKey = await givenApiKey()
      expect((await rate(rawKey, { evaluation: 'NEGATIVE', categories: [] })).status).toBe(400)
    }),
  )

  it(
    'refuse la catégorie AUTRE sans commentaire',
    integrationTest(async () => {
      const rawKey = await givenApiKey()
      expect((await rate(rawKey, { evaluation: 'NEGATIVE', categories: ['AUTRE'] })).status).toBe(
        400,
      )
    }),
  )

  it(
    'accepte un feedback positif sans commentaire',
    integrationTest(async () => {
      const rawKey = await givenApiKey()
      expect((await rate(rawKey, { evaluation: 'POSITIVE' })).status).toBe(204)
    }),
  )

  it(
    'reste en 204 sur une conversation sans tour enregistré',
    integrationTest(async () => {
      const rawKey = await givenApiKey()
      expect(
        (await rate(rawKey, { evaluation: 'NEGATIVE', categories: ['INCOMPREHENSION'] })).status,
      ).toBe(204)
    }),
  )
})

describe.concurrent("cloisonnement de l'évaluation", () => {
  const createTurn = async (principalId: string, conversation: string) => {
    await db().assistantConversation.create({
      data: {
        id: conversation,
        principalId,
        surface: 'ask-libre',
        titre: 'Test',
        messages: [],
      },
    })
    await db().assistantAppel.create({
      data: {
        conversationId: conversation,
        principalId,
        modele: 'openweight-large',
        surface: 'ask-libre',
        transcript: {},
      },
    })
  }

  it(
    'enregistre le retour du principal qui a produit le tour',
    integrationTest(async () => {
      const owner = await fixtures.apiKey()
      const conversation = '018f3a2b-0000-7000-8000-0000000000aa'
      await createTurn(owner.id, conversation)

      await runAsPrincipal(owner.id, () =>
        rateResponse({
          conversationId: conversation,
          body: { evaluation: 'POSITIVE', commentaire: 'utile' },
        }),
      )

      const turn = await db().assistantAppel.findFirst({ where: { conversationId: conversation } })
      expect(turn?.evaluation).toBe('POSITIVE')
    }),
  )

  it(
    "ignore le retour d'un principal qui n'est pas propriétaire de la conversation",
    integrationTest(async () => {
      const owner = await fixtures.apiKey()
      const intruder = await fixtures.apiKey()
      const conversation = '018f3a2b-0000-7000-8000-0000000000bb'
      await createTurn(owner.id, conversation)

      await runAsPrincipal(intruder.id, () =>
        rateResponse({
          conversationId: conversation,
          body: { evaluation: 'NEGATIVE', categories: ['INCOMPREHENSION'] },
        }),
      )

      const turn = await db().assistantAppel.findFirst({ where: { conversationId: conversation } })
      expect(turn?.evaluation).toBeNull()
    }),
  )
})
