import { describe, expect, it } from 'vitest'

import { construireSystemPrompt } from '@/assistant/prompts/construireSystemPrompt'
import { SOCLE } from '@/assistant/prompts/socle'

const maintenant = new Date('2026-08-31T10:00:00Z')

describe('construireSystemPrompt', () => {
  it('empile le socle, la couche de surface et le contexte runtime', () => {
    const prompt = construireSystemPrompt({ surface: 'ask-libre', maintenant })
    expect(prompt.startsWith(SOCLE)).toBe(true)
    expect(prompt).toContain('2026-08-31')
  })

  it('reste court : le socle part à chaque tour', () => {
    expect(SOCLE.split('\n').length).toBeLessThan(45)
  })

  it("n'embarque ni glossaire métier ni catalogue d'entités", () => {
    const prompt = construireSystemPrompt({ surface: 'ask-libre', maintenant })
    expect(prompt).not.toContain('IND-1')
    expect(prompt).not.toContain('Glossaire')
  })

  it('ne porte pas de directive de raisonnement non mesurée', () => {
    expect(SOCLE).not.toContain('Reasoning')
  })
})
