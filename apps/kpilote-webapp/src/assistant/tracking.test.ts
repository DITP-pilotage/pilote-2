import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { describe, expect, it } from 'vitest'

import {
  answerOutcomeEvent,
  choicesPresentedEvent,
  linkEvent,
  pageType,
  questionType,
} from './tracking'

const user: KpiloteUIMessage = { id: 'u', role: 'user', parts: [{ type: 'text', text: 'Q' }] }
const answer = (parts: KpiloteUIMessage['parts'] = []): KpiloteUIMessage => ({
  id: 'a',
  role: 'assistant',
  metadata: { llmCallId: 'call-1' },
  parts: [{ type: 'text', text: 'R' }, ...parts],
})

describe('questionType', () => {
  it('distingue la première question, libre ou proposée, des suivantes', () => {
    expect(questionType({ messages: [], fromProposition: false })).toBe('premiere_libre')
    expect(questionType({ messages: [], fromProposition: true })).toBe('premiere_proposition')
    expect(questionType({ messages: [user, answer()], fromProposition: true })).toBe('suivante')
  })
})

describe('answerOutcomeEvent', () => {
  it('compte une réponse aboutie avec son appel', () => {
    expect(
      answerOutcomeEvent({
        conversationId: 'c',
        message: answer(),
        isAbort: false,
        isError: false,
      }),
    ).toMatchObject({
      name: 'answer.complete',
      context: { conversation_id: 'c', llm_call_id: 'call-1' },
    })
  })

  it('compte une réponse en échec', () => {
    expect(
      answerOutcomeEvent({ conversationId: 'c', message: answer(), isAbort: false, isError: true }),
    ).toMatchObject({ name: 'answer.error', context: { conversation_id: 'c' } })
  })

  it('ne compte pas une réponse arrêtée par l’utilisateur', () => {
    expect(
      answerOutcomeEvent({ conversationId: 'c', message: answer(), isAbort: true, isError: false }),
    ).toBeNull()
  })
})

describe('choicesPresentedEvent', () => {
  it('compte les choix proposés', () => {
    const message = answer([
      {
        type: 'tool-clarify_with_choices',
        toolCallId: 't',
        state: 'output-available',
        input: {
          question: 'Lequel ?',
          choices: [
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b' },
          ],
        },
        output: {
          question: 'Lequel ?',
          choices: [
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b' },
          ],
        },
      },
    ])

    expect(choicesPresentedEvent({ conversationId: 'c', message })).toMatchObject({
      name: 'response.choices',
      context: { conversation_id: 'c', llm_call_id: 'call-1', nombre_choix: 2 },
    })
  })

  it('ne dit rien sans choix', () => {
    expect(choicesPresentedEvent({ conversationId: 'c', message: answer() })).toBeNull()
  })
})

describe('linkEvent', () => {
  it('distingue centre d’aide, liens internes et externes', () => {
    expect(linkEvent('/centre-aide?article=x').name).toBe('response.help_center.link')
    expect(linkEvent('/indicateurs/IND-1').name).toBe('response.link.internal')
    expect(linkEvent('https://exemple.fr').name).toBe('response.link.external')
    expect(linkEvent('//exemple.fr').name).toBe('response.link.external')
  })
})

describe('pageType', () => {
  it('nomme la page d’où l’on pose la question', () => {
    expect(pageType({ indicateurId: 'IND-1' })).toBe('indicateur')
    expect(pageType({ collectionId: 'COL-1', individuId: 'D-1' })).toBe('collection')
    expect(pageType(undefined)).toBe('autre')
  })
})
