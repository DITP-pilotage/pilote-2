import { describe, expect, it } from 'vitest'

import { chatRequestSchema } from './chat'

const request = (message: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) => ({
  id: '018f3a2b-0000-7000-8000-000000000001',
  message: { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'Bonjour' }], ...message },
  ...extra,
})

describe('chatRequestSchema', () => {
  it('accepte un message utilisateur texte', () => {
    expect(chatRequestSchema.safeParse(request()).success).toBe(true)
  })

  it('refuse un message de rôle system', () => {
    expect(chatRequestSchema.safeParse(request({ role: 'system' })).success).toBe(false)
  })

  it('refuse un message de rôle assistant', () => {
    expect(chatRequestSchema.safeParse(request({ role: 'assistant' })).success).toBe(false)
  })

  it("refuse une part d'outil dans le message", () => {
    const parts = [
      {
        type: 'tool-search_indicateurs',
        toolCallId: 't',
        state: 'output-available',
        input: {},
        output: {},
      },
    ]
    expect(chatRequestSchema.safeParse(request({ parts })).success).toBe(false)
  })

  it('refuse un texte vide ou de plus de 4000 caractères', () => {
    const vide = [{ type: 'text', text: '' }]
    const geant = [{ type: 'text', text: 'a'.repeat(4001) }]
    expect(chatRequestSchema.safeParse(request({ parts: vide })).success).toBe(false)
    expect(chatRequestSchema.safeParse(request({ parts: geant })).success).toBe(false)
  })

  it('accepte un contexte de page partiel', () => {
    const parsed = chatRequestSchema.safeParse(request({}, { context: { indicateurId: 'IND-1' } }))
    expect(parsed.success).toBe(true)
  })

  it('refuse un modèle hors liste', () => {
    expect(chatRequestSchema.safeParse(request({}, { model: 'gpt-4' })).success).toBe(false)
  })
})
