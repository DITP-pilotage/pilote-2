import { describe, expect, it } from 'vitest'

import { BASE_PROMPT } from '@/assistant/prompts/base'
import { buildSystemPrompt } from '@/assistant/prompts/buildSystemPrompt'

const now = new Date('2026-08-31T10:00:00Z')

describe('buildSystemPrompt', () => {
  it('empile le socle, la couche de surface et le contexte runtime', () => {
    const prompt = buildSystemPrompt({ surface: 'ask-libre', now })
    expect(prompt.startsWith(BASE_PROMPT)).toBe(true)
    expect(prompt).toContain('2026-08-31')
  })

  it('reste court : le socle part à chaque tour', () => {
    expect(BASE_PROMPT.split('\n').length).toBeLessThan(45)
  })

  it("n'embarque ni glossaire métier ni catalogue d'entités", () => {
    const prompt = buildSystemPrompt({ surface: 'ask-libre', now })
    expect(prompt).not.toContain('IND-1')
    expect(prompt).not.toContain('Glossaire')
  })

  it('ne porte pas de directive de raisonnement non mesurée', () => {
    expect(BASE_PROMPT).not.toContain('Reasoning')
  })
})
