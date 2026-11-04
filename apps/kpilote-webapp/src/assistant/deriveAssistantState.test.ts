import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { describe, expect, it } from 'vitest'

import { deriveAssistantState } from './deriveAssistantState'

const message = (parts: KpiloteUIMessage['parts']): KpiloteUIMessage => ({
  id: 'm',
  role: 'assistant',
  parts,
})

describe('deriveAssistantState', () => {
  it('« réfléchit » quand la question vient de partir', () => {
    expect(deriveAssistantState({ message: undefined, status: 'submitted' })).toBe('thinking')
  })

  it('« consulte les sources » pendant un appel d’outil de données', () => {
    const parts: KpiloteUIMessage['parts'] = [
      {
        type: 'tool-search_indicateurs',
        toolCallId: 't',
        state: 'input-available',
        input: { query: 'fraude' },
      },
    ]
    expect(deriveAssistantState({ message: message(parts), status: 'streaming' })).toBe(
      'consulting-sources',
    )
  })

  it('« consulte le centre d’aide » pendant la consultation de l’aide', () => {
    const parts: KpiloteUIMessage['parts'] = [
      {
        type: 'tool-consult_centre_aide',
        toolCallId: 't',
        state: 'input-available',
        input: { question: 'Comment ?' },
      },
    ]
    expect(deriveAssistantState({ message: message(parts), status: 'streaming' })).toBe(
      'consulting-help',
    )
  })

  it('« rédige » dès que du texte arrive', () => {
    const parts: KpiloteUIMessage['parts'] = [{ type: 'text', text: 'Dans le', state: 'streaming' }]
    expect(deriveAssistantState({ message: message(parts), status: 'streaming' })).toBe('writing')
  })

  it("« réfléchit » entre deux appels d'outils", () => {
    const parts: KpiloteUIMessage['parts'] = [
      {
        type: 'tool-search_indicateurs',
        toolCallId: 't',
        state: 'output-available',
        input: { query: 'fraude' },
        output: { results: [] },
      },
    ]
    expect(deriveAssistantState({ message: message(parts), status: 'streaming' })).toBe('thinking')
  })

  it('aucun état une fois la réponse terminée', () => {
    expect(deriveAssistantState({ message: message([]), status: 'ready' })).toBeNull()
  })

  it('« rédige la synthèse » tant que l’encart n’est pas terminé', () => {
    const input = {
      sujet: { type: 'INDICATEUR' as const, indicateurId: 'IND-1' },
      individuId: 'D-1',
    }
    const writing: KpiloteUIMessage['parts'] = [
      {
        type: 'tool-write_synthese',
        toolCallId: 't',
        state: 'output-available',
        preliminary: true,
        input,
        output: { type: 'synthese', dateRedaction: '', markdown: '# Ti', done: false },
      },
    ]
    expect(deriveAssistantState({ message: message(writing), status: 'streaming' })).toBe(
      'writing-report',
    )
  })
})
