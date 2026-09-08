import { describe, expect, it } from 'vitest'

import { getConversationMessages } from '@/assistant/queries/getConversationMessages'
import { NotFoundError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

const message = { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'Bonjour' }] }

const givenConversation = async (id: string, principalId: string) =>
  db().assistantConversation.create({
    data: { id, principalId, surface: 'ask-libre', titre: 'Test', messages: [message] },
  })

describe.concurrent('getConversationMessages', () => {
  it(
    'rend un historique vide pour une conversation inconnue : premier tour',
    integrationTest(async () => {
      const owner = await fixtures.apiKey()
      const id = '018f3a2b-0000-7000-8000-0000000000d1'
      expect(await getConversationMessages({ id, principalId: owner.id })).toEqual([])
    }),
  )

  it(
    "rend l'historique enregistré au principal propriétaire",
    integrationTest(async () => {
      const owner = await fixtures.apiKey()
      const id = '018f3a2b-0000-7000-8000-0000000000d2'
      await givenConversation(id, owner.id)
      expect(await getConversationMessages({ id, principalId: owner.id })).toEqual([message])
    }),
  )

  it(
    "traite la conversation d'un autre principal comme introuvable",
    integrationTest(async () => {
      const owner = await fixtures.apiKey()
      const intruder = await fixtures.apiKey()
      const id = '018f3a2b-0000-7000-8000-0000000000d3'
      await givenConversation(id, owner.id)
      await expect(getConversationMessages({ id, principalId: intruder.id })).rejects.toThrow(
        NotFoundError,
      )
    }),
  )
})
