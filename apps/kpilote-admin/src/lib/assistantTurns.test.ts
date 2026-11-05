import { describe, expect, it } from 'vitest'

import { assistantTurns } from './assistantTurns'

const user = (text: string) => ({ id: text, role: 'user', parts: [{ type: 'text', text }] })
const assistant = (llmCallId: string, ...texts: string[]) => ({
  id: llmCallId,
  role: 'assistant',
  metadata: { llmCallId },
  parts: [
    { type: 'step-start' },
    { type: 'tool-search', state: 'output-available' },
    ...texts.map((text) => ({ type: 'text', text })),
  ],
})
const appel = (id: string) => ({ id })

describe('assistantTurns', () => {
  it('apparie chaque question à sa réponse et à l’appel qui l’a produite', () => {
    const { turns, replaced } = assistantTurns(
      [user('Q1'), assistant('a1', 'R1'), user('Q2'), assistant('a2', 'R2a', 'R2b')],
      [appel('a1'), appel('a2')],
    )

    expect(turns).toEqual([
      { question: 'Q1', reponse: 'R1', appel: appel('a1') },
      { question: 'Q2', reponse: 'R2a\n\nR2b', appel: appel('a2') },
    ])
    expect(replaced).toEqual([])
  })

  it('met à part l’appel d’une réponse remplacée par une relance', () => {
    const { turns, replaced } = assistantTurns(
      [user('Q1'), assistant('a1bis', 'R1 relancée'), user('Q2'), assistant('a2', 'R2')],
      [appel('a1'), appel('a1bis'), appel('a2')],
    )

    expect(turns.map((turn) => turn.appel)).toEqual([appel('a1bis'), appel('a2')])
    expect(replaced).toEqual([appel('a1')])
  })

  it('laisse sans réponse ni appel une question restée sans suite', () => {
    expect(
      assistantTurns([user('Q1'), assistant('a1', 'R1'), user('Q2')], [appel('a1')]).turns,
    ).toEqual([
      { question: 'Q1', reponse: 'R1', appel: appel('a1') },
      { question: 'Q2', reponse: '', appel: null },
    ])
  })

  it('ignore ce qui n’est pas un message', () => {
    expect(assistantTurns([null, 42, { role: 'system' }, user('Q1')], []).turns).toEqual([
      { question: 'Q1', reponse: '', appel: null },
    ])
  })
})
