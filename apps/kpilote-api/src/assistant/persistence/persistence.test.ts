import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { getConversationMessages } from '@/assistant/persistence/getConversationMessages'
import { rateCall } from '@/assistant/persistence/rateCall'
import { recordTurn } from '@/assistant/persistence/recordTurn'
import { NotFoundError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { integrationTest } from '@/test/integrationTest'
import { runAsUser } from '@/test/runAsPrincipal'

const userMessage = (text: string) => ({
  id: randomUUID(),
  role: 'user',
  parts: [{ type: 'text', text }],
})

const call = (overrides: Partial<Parameters<typeof recordTurn>[0]['call']> = {}) => ({
  id: randomUUID(),
  model: 'openweight-large' as const,
  transcript: { messages: [] },
  tools: ['search_indicateurs'],
  inputTokens: 120,
  outputTokens: 30,
  durationMs: 900,
  subCalls: [],
  ...overrides,
})

const turn = (
  principalId: string,
  conversationId: string,
  callOverrides = {},
  startedOnSavedConversation = false,
) =>
  recordTurn({
    conversationId,
    principalId,
    startedOnSavedConversation,
    contexte: { indicateurId: 'IND-1' },
    messages: [userMessage('Où en est la fraude fiscale ?')],
    call: call(callOverrides),
  })

describe('persistance de l’assistant', () => {
  it(
    'ne recrée pas une conversation supprimée pendant le tour',
    integrationTest(async () => {
      const principalId = randomUUID()
      const conversationId = randomUUID()

      await turn(principalId, conversationId, {}, true)

      expect(
        await db().assistantConversation.findUnique({ where: { id: conversationId } }),
      ).toBeNull()
    }),
  )

  it(
    'écrit la conversation, l’appel et ses sous-appels',
    integrationTest(async () => {
      const principalId = randomUUID()
      const conversationId = randomUUID()
      const callId = randomUUID()

      await turn(principalId, conversationId, {
        id: callId,
        subCalls: [
          {
            name: 'search_indicateurs.ranking',
            model: 'openweight-large',
            inputTokens: 40,
            outputTokens: 4,
            durationMs: 300,
          },
        ],
      })

      const conversation = await db().assistantConversation.findUniqueOrThrow({
        where: { id: conversationId },
      })
      expect(conversation).toEqual(
        expect.objectContaining({
          principalId,
          titre: 'Où en est la fraude fiscale ?',
          contexte: { indicateurId: 'IND-1' },
        }),
      )
      const appel = await db().assistantAppel.findUniqueOrThrow({
        where: { id: callId },
        include: { sousAppels: true },
      })
      expect(appel).toEqual(
        expect.objectContaining({
          conversationId,
          outils: ['search_indicateurs'],
          inputTokens: 120,
          dureeMs: 900,
          sousAppels: [
            expect.objectContaining({ nom: 'search_indicateurs.ranking', inputTokens: 40 }),
          ],
        }),
      )
    }),
  )

  it(
    'garde les deux appels quand deux premiers tours arrivent ensemble',
    integrationTest(async () => {
      const principalId = randomUUID()
      const conversationId = randomUUID()
      const [first, second] = [randomUUID(), randomUUID()]

      await Promise.all([
        turn(principalId, conversationId, { id: first }),
        turn(principalId, conversationId, { id: second }),
      ])

      const appels = await db().assistantAppel.findMany({
        where: { conversationId },
        select: { id: true },
      })
      expect(appels.map((appel) => appel.id).sort()).toEqual([first, second].sort())
    }),
  )

  describe('historique enregistré', () => {
    const message = (id: string, role: 'user' | 'assistant') => ({
      id,
      role,
      parts: [{ type: 'text', text: id }],
    })

    const record = (conversationId: string, principalId: string, ids: string[]) =>
      recordTurn({
        conversationId,
        principalId,
        startedOnSavedConversation: ids.length > 2,
        contexte: null,
        messages: ids.map((id) => message(id, id.startsWith('q') ? 'user' : 'assistant')),
        call: call(),
      })

    const storedIds = async (conversationId: string) => {
      const conversation = await db().assistantConversation.findUniqueOrThrow({
        where: { id: conversationId },
      })
      return (conversation.messages as Array<{ id: string }>).map((stored) => stored.id)
    }

    it(
      'garde les questions de deux tours partis du même historique',
      integrationTest(async () => {
        const principalId = randomUUID()
        const conversationId = randomUUID()
        await record(conversationId, principalId, ['q1', 'a1'])

        await record(conversationId, principalId, ['q1', 'a1', 'qA', 'aA'])
        await record(conversationId, principalId, ['q1', 'a1', 'qB', 'aB'])

        expect(await storedIds(conversationId)).toEqual(['q1', 'a1', 'qA', 'aA', 'qB', 'aB'])
      }),
    )

    it(
      'remplace par une relance la suite de la question relancée',
      integrationTest(async () => {
        const principalId = randomUUID()
        const conversationId = randomUUID()
        await record(conversationId, principalId, ['q1', 'a1'])
        await record(conversationId, principalId, ['q1', 'a1', 'q2', 'a2'])

        await record(conversationId, principalId, ['q1', 'a1', 'q2', 'a2bis'])

        expect(await storedIds(conversationId)).toEqual(['q1', 'a1', 'q2', 'a2bis'])
      }),
    )
  })

  it(
    'ne garde pas les messages d’un tour dont l’appel n’a pas pu être écrit',
    integrationTest(async () => {
      const principalId = randomUUID()
      const conversationId = randomUUID()
      await turn(principalId, conversationId)

      await expect(
        recordTurn({
          conversationId,
          principalId,
          startedOnSavedConversation: true,
          contexte: null,
          messages: [userMessage('Où en est la fraude fiscale ?'), userMessage('Et en Bretagne ?')],
          call: call({ transcript: { tokens: 1n } }),
        }),
      ).rejects.toThrow()

      const conversation = await db().assistantConversation.findUniqueOrThrow({
        where: { id: conversationId },
      })
      expect(JSON.stringify(conversation.messages)).not.toContain('Et en Bretagne ?')
    }),
  )

  it(
    'refuse d’écraser la conversation d’un autre principal',
    integrationTest(async () => {
      const conversationId = randomUUID()
      const owner = randomUUID()
      await turn(owner, conversationId)

      await expect(turn(randomUUID(), conversationId)).rejects.toBeInstanceOf(NotFoundError)

      const conversation = await db().assistantConversation.findUniqueOrThrow({
        where: { id: conversationId },
      })
      expect(conversation.principalId).toBe(owner)
    }),
  )

  it(
    'relit un historique vide pour une conversation inconnue',
    integrationTest(async () => {
      expect(
        await getConversationMessages({ id: randomUUID(), principalId: randomUUID() }),
      ).toEqual([])
    }),
  )

  it(
    'ne relit pas la conversation d’un autre principal',
    integrationTest(async () => {
      const conversationId = randomUUID()
      await turn(randomUUID(), conversationId)

      await expect(
        getConversationMessages({ id: conversationId, principalId: randomUUID() }),
      ).rejects.toBeInstanceOf(NotFoundError)
    }),
  )

  it(
    'note l’appel désigné, pas le dernier de la conversation',
    integrationTest(async () => {
      const principalId = randomUUID()
      const conversationId = randomUUID()
      const first = randomUUID()
      await turn(principalId, conversationId, { id: first })
      await turn(principalId, conversationId, { id: randomUUID() })

      await runAsUser(principalId, () =>
        rateCall({ callId: first, body: { evaluation: 'POSITIVE' } }),
      )

      const notes = await db().assistantAppel.findMany({
        where: { conversationId },
        select: { id: true, evaluation: true },
      })
      expect(notes.filter((note) => note.evaluation === 'POSITIVE')).toEqual([
        { id: first, evaluation: 'POSITIVE' },
      ])
    }),
  )

  it(
    'n’enregistre pas un commentaire vide',
    integrationTest(async () => {
      const principalId = randomUUID()
      const callId = randomUUID()
      await turn(principalId, randomUUID(), { id: callId })

      await runAsUser(principalId, () =>
        rateCall({ callId, body: { evaluation: 'POSITIVE', commentaire: '   ' } }),
      )

      const appel = await db().assistantAppel.findUniqueOrThrow({ where: { id: callId } })
      expect(appel.commentaire).toBeNull()
    }),
  )

  it(
    'ignore la note d’un appel appartenant à un autre principal',
    integrationTest(async () => {
      const callId = randomUUID()
      await turn(randomUUID(), randomUUID(), { id: callId })

      await runAsUser(randomUUID(), () =>
        rateCall({
          callId,
          body: { evaluation: 'NEGATIVE', categories: ['AUTRE'], commentaire: 'faux' },
        }),
      )

      const appel = await db().assistantAppel.findUniqueOrThrow({ where: { id: callId } })
      expect(appel.evaluation).toBeNull()
    }),
  )
})
