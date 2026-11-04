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
