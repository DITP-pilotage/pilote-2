import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { describe, expect, it } from 'vitest'

import { hasDashboard } from './dashboardParts'

const input = { task: 't', indicateurIds: ['IND-1'] }
const output = {
  titre: 'T',
  containers: [{ widgets: [{ type: 'titre_section' as const, titre: 'Emploi' }] }],
  labels: {},
}

const message = (parts: KpiloteUIMessage['parts']): KpiloteUIMessage => ({
  id: 'm',
  role: 'assistant',
  parts,
})

describe('hasDashboard', () => {
  it('vrai quand un dashboard a été composé', () => {
    expect(
      hasDashboard(
        message([
          {
            type: 'tool-create_dashboard',
            toolCallId: 't',
            state: 'output-available',
            input,
            output,
          },
        ]),
      ),
    ).toBe(true)
  })

  it('faux pour un dashboard refusé ou encore en cours', () => {
    expect(
      hasDashboard(
        message([
          {
            type: 'tool-create_dashboard',
            toolCallId: 't',
            state: 'output-available',
            input,
            output: { error: 'refusé' },
          },
          { type: 'tool-create_dashboard', toolCallId: 'u', state: 'input-available', input },
        ]),
      ),
    ).toBe(false)
  })
})
