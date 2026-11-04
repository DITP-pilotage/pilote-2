import { describe, expect, it } from 'vitest'

import { questionToSend } from './pendingQuestion'

const pending = { id: 'q2', text: 'Et dans le Nord ?' }

describe('questionToSend', () => {
  it('envoie une question de la palette pas encore envoyée', () => {
    expect(questionToSend({ pending, lastSentId: 'q1', status: 'ready' })).toEqual(pending)
  })

  it('attend la fin de la réponse en cours', () => {
    expect(questionToSend({ pending, lastSentId: 'q1', status: 'streaming' })).toBeNull()
    expect(questionToSend({ pending, lastSentId: 'q1', status: 'submitted' })).toBeNull()
  })

  it('n’envoie pas deux fois la même question', () => {
    expect(questionToSend({ pending, lastSentId: 'q2', status: 'ready' })).toBeNull()
    expect(questionToSend({ pending: null, lastSentId: null, status: 'ready' })).toBeNull()
  })
})
