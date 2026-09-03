import { describe, expect, it } from 'vitest'

import { deriveTitle } from '@/assistant/commands/recordConversation'

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
