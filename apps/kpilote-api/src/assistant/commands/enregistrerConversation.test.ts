import { describe, expect, it } from 'vitest'

import { deriverTitre } from '@/assistant/commands/enregistrerConversation'

describe('deriverTitre', () => {
  it('reprend le premier message utilisateur', () => {
    const messages = [
      { role: 'assistant', parts: [{ type: 'text', text: 'Bonjour' }] },
      { role: 'user', parts: [{ type: 'text', text: 'Où en est la fraude fiscale ?' }] },
    ]
    expect(deriverTitre(messages)).toBe('Où en est la fraude fiscale ?')
  })

  it('tronque au-delà de quatre-vingts caractères', () => {
    const texte = 'a'.repeat(200)
    const titre = deriverTitre([{ role: 'user', parts: [{ type: 'text', text: texte }] }])
    expect(titre).toHaveLength(80)
    expect(titre.endsWith('…')).toBe(true)
  })

  it('retombe sur un titre par défaut sans message utilisateur exploitable', () => {
    expect(deriverTitre([])).toBe('Nouvelle conversation')
    expect(deriverTitre([{ role: 'user', parts: [] }])).toBe('Nouvelle conversation')
  })
})
