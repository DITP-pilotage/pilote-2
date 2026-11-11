import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import type { CentreAideOutput } from '@pilote/kpilote-shared/assistant/tools'

/** La dernière consultation aboutie du centre d'aide dans un message, s'il y en a une. */
export const latestHelpConsultation = (message: KpiloteUIMessage): CentreAideOutput | null => {
  for (const part of [...message.parts].reverse()) {
    if (
      part.type === 'tool-consult_centre_aide' &&
      part.state === 'output-available' &&
      !('error' in part.output)
    ) {
      return part.output
    }
  }
  return null
}

const CONTACT_ONLY: CentreAideOutput = { found: false, answer: '', sources: [] }

/**
 * Ce que l'encart du centre d'aide doit montrer : la dernière consultation aboutie, ou le
 * contact quand la dernière consultation a échoué. `null` sans consultation.
 */
export const helpToDisplay = (message: KpiloteUIMessage): CentreAideOutput | null => {
  const consultations = message.parts.filter(
    (part) => part.type === 'tool-consult_centre_aide' && part.state === 'output-available',
  )
  if (consultations.length === 0) return null
  return latestHelpConsultation(message) ?? CONTACT_ONLY
}
