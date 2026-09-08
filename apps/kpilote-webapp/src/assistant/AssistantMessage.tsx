import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { isToolUIPart } from 'ai'

import { MarkdownResponse } from './MarkdownResponse'
import { SourcesPanel } from './SourcesPanel'
import { ViewGrid } from './tiles/ViewGrid'
import { ToolCallIndicator } from './ToolCallIndicator'

export function AssistantMessage({ message }: { message: KpiloteUIMessage }) {
  if (message.role === 'user') {
    // `w-fit` en plus de `ml-auto` : sans lui la bulle occupe toute sa largeur maximale et
    // le texte paraît centré au lieu d'être collé à droite.
    return (
      <div className="flex justify-end">
        <p className="w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-primary-foreground">
          {message.parts
            .filter((part) => part.type === 'text')
            .map((part) => part.text)
            .join(' ')}
        </p>
      </div>
    )
  }

  return (
    <div className="flex max-w-[85%] flex-col gap-2">
      {message.parts.map((part, index) => {
        // Le modèle répond en markdown : gras, listes, citations, parfois un tableau.
        if (part.type === 'text') {
          return <MarkdownResponse key={index} text={part.text} />
        }

        // Part typée grâce au paramètre TOOLS de KpiloteUIMessage : `part.data` est
        // `Source[]`, pas `unknown`.
        if (part.type === 'data-sources') {
          return <SourcesPanel key={index} sources={part.data} />
        }

        // Part typée grâce à `KpiloteUITools` : `part.output` est `View | { error }`.
        if (part.type === 'tool-compose_view' && part.state === 'output-available') {
          // Le cas d'erreur ne rend rien : le modèle recoit le message et l'explique
          // lui-même dans sa réponse texte.
          if ('error' in part.output) return null
          return <ViewGrid key={index} view={part.output} />
        }

        // `startsWith('tool-')` ne restreint pas l'union pour TypeScript : le garde du SDK, si.
        if (isToolUIPart(part)) {
          return <ToolCallIndicator key={index} part={part} />
        }

        return null
      })}
    </div>
  )
}
