import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'

import { cleanPseudoCalls } from './cleanPseudoCalls'
import { flattenLatex } from './flattenLatex'

import { latestHelpConsultation } from './centreAide'
import { writtenRapports } from './rapport'

/**
 * Le texte de la réponse tel que l'utilisateur le lit : ses encarts, son texte sans les
 * artefacts du modèle, puis les pages du centre d'aide citées.
 */
export const copyableText = (message: KpiloteUIMessage, origin: string): string => {
  const text = message.parts
    .flatMap((part) => (part.type === 'text' ? [flattenLatex(cleanPseudoCalls(part.text))] : []))
    .filter((chunk) => chunk.length > 0)
  const help = latestHelpConsultation(message)
  const pages =
    help?.found && help.sources.length > 0
      ? [
          [
            'Pages du centre d’aide :',
            ...help.sources.map((source) => `- ${source.titre} : ${origin}${source.url}`),
          ].join('\n'),
        ]
      : []
  const rapports = writtenRapports(message).map((rapport) => rapport.markdown)
  return [...rapports, ...text, ...pages].join('\n\n')
}
