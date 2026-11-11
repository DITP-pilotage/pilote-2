import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { describe, expect, it } from 'vitest'

import { helpToDisplay } from './centreAide'

describe('helpToDisplay', () => {
  it('propose le contact quand la consultation du centre d’aide a échoué', () => {
    const message: KpiloteUIMessage = {
      id: 'm',
      role: 'assistant',
      parts: [
        {
          type: 'tool-consult_centre_aide',
          toolCallId: 't',
          state: 'output-available',
          input: { question: 'Comment ?' },
          output: { error: 'boom' },
        },
      ],
    }

    expect(helpToDisplay(message)).toEqual({ found: false, answer: '', sources: [] })
  })

  it('n’affiche rien sans consultation du centre d’aide', () => {
    expect(helpToDisplay({ id: 'm', role: 'assistant', parts: [] })).toBeNull()
  })
})
