import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { describe, expect, it } from 'vitest'

import { copyableText } from './copyResponse'

describe('copyableText', () => {
  it('copie le texte de la réponse sans pseudo-appels ni LaTeX', () => {
    const message: KpiloteUIMessage = {
      id: 'm',
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: 'search_indicateurs({"query": "x"})\nLe taux vaut \\(\\frac{1}{2}\\).',
        },
        {
          type: 'tool-search_indicateurs',
          toolCallId: 't',
          state: 'output-available',
          input: { query: 'x' },
          output: { results: [] },
        },
        { type: 'text', text: 'Fin.' },
      ],
    }

    expect(copyableText(message)).toBe('Le taux vaut 1 / 2.\n\nFin.')
  })
})
