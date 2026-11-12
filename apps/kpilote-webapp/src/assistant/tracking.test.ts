import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { describe, expect, it } from 'vitest'

import {
  answerOutcomeEvent,
  choicesPresentedEvent,
  linkEvent,
  pageType,
  propositionViewKey,
  questionOrigin,
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

  it('compte comme suivante la question reposée après un échec sans réponse', () => {
    expect(questionType({ messages: [user], fromProposition: false })).toBe('suivante')
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
        finishReason: 'stop',
      }),
    ).toMatchObject({
      name: 'answer.complete',
      context: { conversation_id: 'c', llm_call_id: 'call-1' },
    })
  })

  it('compte une réponse en échec', () => {
    expect(
      answerOutcomeEvent({
        conversationId: 'c',
        message: answer(),
        isAbort: false,
        isError: true,
        finishReason: undefined,
      }),
    ).toMatchObject({ name: 'answer.error', context: { conversation_id: 'c' } })
  })

  it('compte en échec une réponse interrompue avant la fin du flux', () => {
    expect(
      answerOutcomeEvent({
        conversationId: 'c',
        message: answer(),
        isAbort: false,
        isError: false,
        finishReason: undefined,
      }),
    ).toMatchObject({ name: 'answer.error', context: { conversation_id: 'c' } })
  })

  it('ne compte pas une réponse arrêtée par l’utilisateur', () => {
    expect(
      answerOutcomeEvent({
        conversationId: 'c',
        message: answer(),
        isAbort: true,
        isError: false,
        finishReason: undefined,
      }),
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
    expect(linkEvent('/centre-aide?article=x')?.name).toBe('response.help_center.link')
    expect(linkEvent('/indicateurs/IND-1')?.name).toBe('response.link.internal')
    expect(linkEvent('https://exemple.fr')?.name).toBe('response.link.external')
    expect(linkEvent('//exemple.fr')?.name).toBe('response.link.external')
  })

  it('ne prend pour le centre d’aide que ses propres pages', () => {
    expect(linkEvent('/centre-aide')?.name).toBe('response.help_center.link')
    expect(linkEvent('/centre-aide-archives')?.name).toBe('response.link.internal')
  })

  it('ignore les liens qui ne mènent pas à une page', () => {
    expect(linkEvent('mailto:contact@exemple.fr')).toBeNull()
    expect(linkEvent('tel:+33100000000')).toBeNull()
    expect(linkEvent('#ancre')).toBeNull()
    expect(linkEvent('relatif')).toBeNull()
  })
})

describe('pageType', () => {
  it('nomme la page d’où l’on pose la question', () => {
    expect(pageType({ indicateurId: 'IND-1' })).toBe('indicateur')
    expect(pageType({ collectionId: 'COL-1', individuId: 'D-1' })).toBe('collection')
    expect(pageType(undefined)).toBe('autre')
  })
})

describe('questionOrigin', () => {
  it('attribue à la proposition une question qui complète son début', () => {
    expect(
      questionOrigin({
        text: 'Compare cet indicateur entre le Var et le Vaucluse',
        prefill: 'Compare cet indicateur entre ',
      }),
    ).toBe('proposition')
  })

  it('compte comme saisie une question réécrite par-dessus la proposition', () => {
    expect(
      questionOrigin({ text: 'Quels indicateurs suivent la fraude ?', prefill: 'Compare ' }),
    ).toBe('saisie')
    expect(questionOrigin({ text: 'Bonjour', prefill: null })).toBe('saisie')
  })
})

describe('propositionViewKey', () => {
  it('distingue l’écran vide affiché sur une autre page', () => {
    expect(
      propositionViewKey({ conversationId: 'c', pageContext: { indicateurId: 'IND-1' } }),
    ).not.toBe(propositionViewKey({ conversationId: 'c', pageContext: { indicateurId: 'IND-2' } }))
    expect(propositionViewKey({ conversationId: 'c', pageContext: undefined })).not.toBe(
      propositionViewKey({ conversationId: 'd', pageContext: undefined }),
    )
  })

  it('reste la même quand le panneau se remonte sur la même page', () => {
    expect(
      propositionViewKey({ conversationId: 'c', pageContext: { indicateurId: 'IND-1' } }),
    ).toBe(propositionViewKey({ conversationId: 'c', pageContext: { indicateurId: 'IND-1' } }))
  })
})
