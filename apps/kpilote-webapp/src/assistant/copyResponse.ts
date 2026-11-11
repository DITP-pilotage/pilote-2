import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'

import { cleanPseudoCalls } from './cleanPseudoCalls'
import { flattenLatex } from './flattenLatex'

/** Le texte de la réponse tel que l'utilisateur le lit, sans les artefacts du modèle. */
export const copyableText = (message: KpiloteUIMessage): string =>
  message.parts
    .flatMap((part) => (part.type === 'text' ? [flattenLatex(cleanPseudoCalls(part.text))] : []))
    .filter((text) => text.length > 0)
    .join('\n\n')
