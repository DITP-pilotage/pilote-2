import { describe, expect, it } from 'vitest'

import { assistantTurns } from './assistantTurns'

const user = (text: string) => ({ id: text, role: 'user', parts: [{ type: 'text', text }] })
const assistant = (...texts: string[]) => ({
  id: texts.join(),
  role: 'assistant',
  parts: [
    { type: 'step-start' },
    { type: 'tool-search', state: 'output-available' },
    ...texts.map((text) => ({ type: 'text', text })),
  ],
})

describe('assistantTurns', () => {
  it('apparie chaque question à sa réponse et à son appel, dans l’ordre', () => {
    const turns = assistantTurns(
      [user('Q1'), assistant('R1'), user('Q2'), assistant('R2a', 'R2b')],
      ['appel-1', 'appel-2'],
    )

    expect(turns).toEqual([
      { question: 'Q1', reponse: 'R1', appel: 'appel-1' },
      { question: 'Q2', reponse: 'R2a\n\nR2b', appel: 'appel-2' },
    ])
  })

  it('laisse sans réponse ni appel une question restée sans suite', () => {
    expect(assistantTurns([user('Q1'), assistant('R1'), user('Q2')], ['appel-1'])).toEqual([
      { question: 'Q1', reponse: 'R1', appel: 'appel-1' },
      { question: 'Q2', reponse: '', appel: null },
    ])
  })

  it('ignore ce qui n’est pas un message', () => {
    expect(assistantTurns([null, 42, { role: 'system' }, user('Q1')], [])).toEqual([
      { question: 'Q1', reponse: '', appel: null },
    ])
  })
})
