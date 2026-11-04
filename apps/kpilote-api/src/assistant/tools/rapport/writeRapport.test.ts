import { describe, expect, it } from 'vitest'

import { rapportToModel, writeRapport } from '@/assistant/tools/rapport/writeRapport'

const now = new Date('2026-11-04T10:00:00Z')

async function* chunks(texts: string[], clock: { t: number }, step: number) {
  for (const text of texts) {
    await Promise.resolve()
    clock.t += step
    yield text
  }
}

const collect = async <T>(iterable: AsyncIterable<T>): Promise<T[]> => {
  const states: T[] = []
  for await (const state of iterable) states.push(state)
  return states
}

describe('writeRapport', () => {
  it('émet un état vide, regroupe les morceaux puis termine avec tout le texte', async () => {
    const clock = { t: 0 }
    const states = await collect(
      writeRapport({
        type: 'synthese',
        collected: { donnees: { a: 1 } },
        redact: () => chunks(['# Ti', 'tre', '\n\nTexte'], clock, 100),
        now,
        clock: () => clock.t,
      }),
    )

    expect(states.map((state) => [state.markdown, state.done])).toEqual([
      ['', false],
      ['# Titre', false],
      ['# Titre\n\nTexte', true],
    ])
    expect(states[0]?.dateRedaction).toBe('2026-11-04T10:00:00.000Z')
  })

  it('ne rédige rien quand le sujet est introuvable', async () => {
    let redacted = false
    const states = await collect(
      writeRapport({
        type: 'synthese',
        collected: { notFound: ['IND-9'] },
        redact: () => {
          redacted = true
          return chunks([], { t: 0 }, 0)
        },
        now,
      }),
    )

    expect(states).toEqual([
      {
        type: 'synthese',
        dateRedaction: now.toISOString(),
        markdown: '',
        done: true,
        notFound: ['IND-9'],
      },
    ])
    expect(redacted).toBe(false)
  })

  it('transmet au sous-agent les données en JSON', async () => {
    const prompts: string[] = []
    await collect(
      writeRapport({
        type: 'comparaison',
        collected: { donnees: { taux: '67 %' } },
        redact: (prompt) => {
          prompts.push(prompt)
          return chunks(['ok'], { t: 0 }, 0)
        },
        now,
      }),
    )

    expect(prompts).toEqual([JSON.stringify({ taux: '67 %' })])
  })
})

describe('rapportToModel', () => {
  const base = { type: 'synthese' as const, dateRedaction: '', done: true }

  it('ne montre au modèle principal que le texte de l’encart', () => {
    expect(rapportToModel({ ...base, markdown: '# Titre' })).toBe('# Titre')
  })

  it('dit ce qui a empêché l’encart', () => {
    expect(rapportToModel({ ...base, markdown: '', notFound: ['IND-9'] })).toContain('IND-9')
    expect(
      rapportToModel({ ...base, markdown: '', needsClarification: 'Il faut deux individus.' }),
    ).toBe('Il faut deux individus.')
  })
})
