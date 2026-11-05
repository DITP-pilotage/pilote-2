import { type ModelMessage } from 'ai'
import { describe, expect, it } from 'vitest'

import { MAX_TURNS, TURNS_WITH_TOOLS, windowHistory } from '@/assistant/historyWindow'

const turn = (index: number): ModelMessage[] => [
  { role: 'user', content: [{ type: 'text', text: `question ${index}` }] },
  {
    role: 'assistant',
    content: [
      { type: 'reasoning', text: `réflexion ${index}` },
      { type: 'tool-call', toolCallId: `call-${index}`, toolName: 'search', input: {} },
    ],
  },
  {
    role: 'tool',
    content: [
      {
        type: 'tool-result',
        toolCallId: `call-${index}`,
        toolName: 'search',
        output: { type: 'json', value: { donnees: index } },
      },
    ],
  },
  { role: 'assistant', content: [{ type: 'text', text: `réponse ${index}` }] },
]

const conversation = (turns: number): ModelMessage[] => [
  ...Array.from({ length: turns }, (_, index) => turn(index + 1)).flat(),
  { role: 'user', content: [{ type: 'text', text: 'nouvelle question' }] },
]

const texts = (messages: ModelMessage[]) => JSON.stringify(messages)

describe('windowHistory', () => {
  it('laisse intacte une conversation courte, hors réflexions passées', () => {
    const messages = conversation(2)

    const windowed = windowHistory(messages)

    expect(texts(windowed)).toContain('call-1')
    expect(texts(windowed)).toContain('question 1')
    expect(texts(windowed)).not.toContain('réflexion')
  })

  it('ne garde que les derniers tours, en commençant par une question', () => {
    const windowed = windowHistory(conversation(MAX_TURNS + 5))

    expect(windowed.filter((message) => message.role === 'user')).toHaveLength(MAX_TURNS)
    expect(windowed[0]?.role).toBe('user')
    expect(texts(windowed)).not.toContain('"question 6"')
    expect(texts(windowed)).toContain('"question 7"')
    expect(windowed.at(-1)).toEqual(conversation(0)[0])
  })

  it('retire les appels d’outils des tours anciens mais garde leurs réponses', () => {
    const windowed = windowHistory(conversation(MAX_TURNS))
    // Les tours précédant la question en cours : seuls les TURNS_WITH_TOOLS derniers gardent leurs outils.
    const oldest = MAX_TURNS - TURNS_WITH_TOOLS
    const recent = oldest + 1

    expect(texts(windowed)).not.toContain(`call-${oldest}"`)
    expect(texts(windowed)).toContain(`réponse ${oldest}`)
    expect(texts(windowed)).toContain(`call-${recent}"`)
    expect(texts(windowed)).toContain(`"donnees":${recent}`)
    expect(windowed.every((message) => message.content.length > 0)).toBe(true)
  })
})
