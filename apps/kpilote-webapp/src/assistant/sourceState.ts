import type { SourceToolPart } from './ConsultedSources'

export type SourceState = 'running' | 'done' | 'failed'

/**
 * L'enveloppe des outils convertit une exception en sortie `{ error }` lisible par le
 * modèle : une telle sortie est un échec, pas un résultat.
 */
export const sourceState = (part: SourceToolPart): SourceState => {
  if (part.state === 'output-error') return 'failed'
  if (part.state !== 'output-available') return 'running'
  return typeof part.output === 'object' && part.output !== null && 'error' in part.output
    ? 'failed'
    : 'done'
}
