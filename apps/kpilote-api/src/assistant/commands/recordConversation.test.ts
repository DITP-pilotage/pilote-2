import { describe, expect, it } from 'vitest'

import { deriveTitle, recordConversation } from '@/assistant/commands/recordConversation'
import { NotFoundError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe('deriveTitle', () => {
  it('reprend le premier message utilisateur', () => {
    const messages = [
      { role: 'assistant', parts: [{ type: 'text', text: 'Bonjour' }] },
      { role: 'user', parts: [{ type: 'text', text: 'Où en est la fraude fiscale ?' }] },
    ]
    expect(deriveTitle(messages)).toBe('Où en est la fraude fiscale ?')
  })

  it('tronque au-delà de quatre-vingts caractères', () => {
    const text = 'a'.repeat(200)
    const title = deriveTitle([{ role: 'user', parts: [{ type: 'text', text }] }])
    expect(title).toHaveLength(80)
    expect(title.endsWith('…')).toBe(true)
  })

  it('retombe sur un title par défaut sans message utilisateur exploitable', () => {
    expect(deriveTitle([])).toBe('Nouvelle conversation')
    expect(deriveTitle([{ role: 'user', parts: [] }])).toBe('Nouvelle conversation')
  })
})

const message = (text: string) => ({ id: text, role: 'user', parts: [{ type: 'text', text }] })

describe.concurrent('recordConversation', () => {
  it(
    'crée la conversation au premier tour puis la met à jour',
    integrationTest(async () => {
      const owner = await fixtures.apiKey()
      const id = '018f3a2b-0000-7000-8000-0000000000e1'

      await recordConversation({
        id,
        principalId: owner.id,
        surface: 'ask-libre',
        messages: [message('un')],
      })
      await recordConversation({
        id,
        principalId: owner.id,
        surface: 'ask-libre',
        messages: [message('un'), message('deux')],
      })

      const stored = await db().assistantConversation.findUnique({ where: { id } })
      expect(stored?.titre).toBe('un')
      expect(stored?.messages).toHaveLength(2)
    }),
  )

  it(
    "n'écrase jamais la conversation d'un autre principal",
    integrationTest(async () => {
      const owner = await fixtures.apiKey()
      const intruder = await fixtures.apiKey()
      const id = '018f3a2b-0000-7000-8000-0000000000e2'
      await recordConversation({
        id,
        principalId: owner.id,
        surface: 'ask-libre',
        messages: [message('mien')],
      })

      await expect(
        recordConversation({
          id,
          principalId: intruder.id,
          surface: 'ask-libre',
          messages: [message('pirate')],
        }),
      ).rejects.toThrow(NotFoundError)

      const stored = await db().assistantConversation.findUnique({ where: { id } })
      expect(stored?.principalId).toBe(owner.id)
      expect(stored?.messages).toEqual([message('mien')])
    }),
  )
})
