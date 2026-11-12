import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { describe, expect, it } from 'vitest'

import { rapportFileName, writtenRapports } from './rapport'

describe('rapportFileName', () => {
  it('nomme le fichier d’après le titre de l’encart, sans accents', () => {
    expect(
      rapportFileName({
        markdown: '# Synthèse : Emploi — Côte-d’Or\n\nTexte',
        type: 'synthese',
        dateRedaction: '2026-11-04T10:00:00Z',
      }),
    ).toBe('synthese-emploi-cote-d-or')
  })

  it('se rabat sur le type et la date sans titre', () => {
    expect(
      rapportFileName({
        markdown: 'Texte',
        type: 'comparaison',
        dateRedaction: '2026-11-04T10:00:00Z',
      }),
    ).toBe('comparaison-2026-11-04')
  })
})

describe('writtenRapports', () => {
  it('ne retient que les encarts rédigés', () => {
    const base = { type: 'synthese' as const, dateRedaction: '', done: true }
    const message: KpiloteUIMessage = {
      id: 'm',
      role: 'assistant',
      parts: [
        {
          type: 'tool-write_synthese',
          toolCallId: 'a',
          state: 'output-available',
          input: { sujet: { type: 'INDICATEUR', indicateurId: 'IND-1' }, individuId: 'D-1' },
          output: { ...base, markdown: '# A' },
        },
        {
          type: 'tool-write_synthese',
          toolCallId: 'b',
          state: 'output-available',
          input: { sujet: { type: 'INDICATEUR', indicateurId: 'IND-2' }, individuId: 'D-1' },
          output: { ...base, markdown: '', notFound: ['IND-2'] },
        },
      ],
    }

    expect(writtenRapports(message).map((rapport) => rapport.markdown)).toEqual(['# A'])
  })

  it('écarte un encart dont la rédaction s’est interrompue', () => {
    const message: KpiloteUIMessage = {
      id: 'm',
      role: 'assistant',
      parts: [
        {
          type: 'tool-write_synthese',
          toolCallId: 'a',
          state: 'output-available',
          preliminary: true,
          input: { sujet: { type: 'INDICATEUR', indicateurId: 'IND-1' }, individuId: 'D-1' },
          output: { type: 'synthese', dateRedaction: '', markdown: '# Ti', done: false },
        },
      ],
    }

    expect(writtenRapports(message)).toEqual([])
  })
})
