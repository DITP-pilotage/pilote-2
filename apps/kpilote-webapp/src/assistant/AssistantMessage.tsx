import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { LIBELLES_OUTILS, type NomOutil } from '@pilote/kpilote-shared/assistant/tools'
import { isToolUIPart } from 'ai'

import { clsxm } from '@/lib/clsxm'

import { nettoyerPseudoAppels } from './nettoyerPseudoAppels'
import { PanneauSources } from './PanneauSources'
import { GrilleVue } from './vignettes/GrilleVue'

const libelleOutil = (typePart: string): string => {
  const nom = typePart.replace(/^tool-/u, '') as NomOutil
  return LIBELLES_OUTILS[nom] ?? nom
}

export function AssistantMessage({ message }: { message: KpiloteUIMessage }) {
  if (message.role === 'user') {
    return (
      <p className="ml-auto max-w-[80%] rounded bg-surface px-3 py-2">
        {message.parts
          .filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join(' ')}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {message.parts.map((part, index) => {
        if (part.type === 'text') {
          const texte = nettoyerPseudoAppels(part.text)
          if (texte.length === 0) return null
          return (
            <p key={index} className="whitespace-pre-wrap">
              {texte}
            </p>
          )
        }

        // Part typée grâce au paramètre TOOLS de KpiloteUIMessage : `part.data` est
        // `Source[]`, pas `unknown`.
        if (part.type === 'data-sources') {
          return <PanneauSources key={index} sources={part.data} />
        }

        // Part typée grâce à `KpiloteUITools` : `part.output` est `Vue | { erreur }`.
        if (part.type === 'tool-compose_vue' && part.state === 'output-available') {
          // Le cas d'erreur ne rend rien : le modèle recoit le message et l'explique
          // lui-même dans sa réponse texte.
          if ('erreur' in part.output) return null
          return <GrilleVue key={index} vue={part.output} />
        }

        // `startsWith('tool-')` ne restreint pas l'union pour TypeScript : le garde du SDK, si.
        if (isToolUIPart(part)) {
          const enCours = part.state !== 'output-available' && part.state !== 'output-error'
          return (
            <p
              key={index}
              className={clsxm('text-xs italic text-text-subtle', enCours && 'animate-pulse')}
              aria-live="polite"
            >
              {libelleOutil(part.type)}
              {part.state === 'output-error' ? ' — échec' : enCours ? '…' : ''}
            </p>
          )
        }

        return null
      })}
    </div>
  )
}
