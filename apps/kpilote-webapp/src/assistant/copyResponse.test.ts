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

    expect(copyableText(message, 'https://kpilote.fr')).toBe('Le taux vaut 1 / 2.\n\nFin.')
  })

  it('ajoute les pages du centre d’aide citées, avec leur adresse complète', () => {
    const message: KpiloteUIMessage = {
      id: 'm',
      role: 'assistant',
      parts: [
        {
          type: 'tool-consult_centre_aide',
          toolCallId: 't',
          state: 'output-available',
          input: { question: 'Comment ?' },
          output: {
            found: true,
            answer: 'Ainsi.',
            sources: [
              { id: 'a1', titre: 'Importer', chemin: ['Données'], url: '/centre-aide?article=a1' },
            ],
          },
        },
        { type: 'text', text: 'Voici.' },
      ],
    }

    expect(copyableText(message, 'https://kpilote.fr')).toBe(
      'Voici.\n\nPages du centre d’aide :\n- Importer : https://kpilote.fr/centre-aide?article=a1',
    )
  })
})
