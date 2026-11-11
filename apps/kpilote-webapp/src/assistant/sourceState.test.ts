import { describe, expect, it } from 'vitest'

import type { SourceToolPart } from './ConsultedSources'
import { sourceState } from './sourceState'

const part = (overrides: Partial<SourceToolPart>): SourceToolPart =>
  ({
    type: 'tool-search_indicateurs',
    toolCallId: 't',
    state: 'input-available',
    input: { query: 'x' },
    ...overrides,
  }) as SourceToolPart

describe('sourceState', () => {
  it('en cours tant que la sortie n’est pas arrivée', () => {
    expect(sourceState(part({}))).toBe('running')
  })

  it('en échec quand l’outil a renvoyé une erreur lisible', () => {
    expect(sourceState(part({ state: 'output-available', output: { error: 'boom' } }))).toBe(
      'failed',
    )
  })

  it('terminé quand la sortie est une donnée', () => {
    expect(sourceState(part({ state: 'output-available', output: { results: [] } }))).toBe('done')
  })
})
