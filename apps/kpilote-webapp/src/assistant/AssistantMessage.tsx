import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { memo, type ReactNode } from 'react'

import { AssistantSignature } from './AssistantSignature'
import { helpToDisplay } from './centreAide'
import { CentreAideEncart } from './CentreAideEncart'
import { ChoicesInline } from './ChoicesInline'
import { ConsultedSources, isSourcePart } from './ConsultedSources'
import { type AssistantState } from './deriveAssistantState'
import { MarkdownResponse } from './MarkdownResponse'
import { DashboardLoader, DashboardRender } from './dashboard/DashboardRender'
import { dashboardOutput, isDashboardPart } from './dashboard/dashboardParts'
import { isRapportPart, rapportOutput, rapportTypeOf, type RapportPart } from './rapport'
import { RapportEncart } from './RapportEncart'

export function UserMessage({ message }: { message: KpiloteUIMessage }) {
  return (
    <div className="flex justify-end">
      <p className="m-0 w-fit max-w-[80%] bg-primary-tinted px-4 py-2.5 text-text">
        {message.parts
          .filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join(' ')}
      </p>
    </div>
  )
}

/** L'encart d'un outil de rédaction : en attente tant que l'outil n'a rien émis. */
function RapportOf({
  part,
  isStreaming,
  llmCallId,
}: {
  part: RapportPart
  isStreaming: boolean
  llmCallId: string | undefined
}) {
  const pending = part.state === 'input-streaming' || part.state === 'input-available'
  const output = pending
    ? { type: rapportTypeOf(part), dateRedaction: '', markdown: '', done: false }
    : rapportOutput(part)
  if (!output || (pending && !isStreaming)) return null
  return <RapportEncart output={output} isStreaming={isStreaming} llmCallId={llmCallId} />
}

export const AssistantMessage = memo(function AssistantMessage({
  message,
  state,
  showChoices,
  onChoose,
  onWriteOther,
  actions,
}: {
  message: KpiloteUIMessage
  /** Ce que fait l'assistant, sous sa signature ; `null` une fois la réponse terminée. */
  state: AssistantState | null
  showChoices: boolean
  onChoose: (label: string) => void
  onWriteOther: () => void
  actions?: ReactNode
}) {
  const sources = message.parts.filter(isSourcePart)
  const help = helpToDisplay(message)

  return (
    <div className="flex w-full flex-col gap-3 text-[15px] leading-6 text-text">
      <AssistantSignature state={state} />
      {sources.length > 0 && <ConsultedSources parts={sources} />}
      {message.parts.map((part, index) => {
        if (part.type === 'text' && part.text.length > 0) {
          return <MarkdownResponse key={index} text={part.text} />
        }
        if (isDashboardPart(part)) {
          if (part.state === 'output-error') return null
          const dashboard = dashboardOutput(part)
          if (dashboard) {
            return (
              <DashboardRender key={index} dashboard={dashboard} toolCallId={part.toolCallId} />
            )
          }
          return part.state === 'output-available' || state === null ? null : (
            <DashboardLoader key={index} />
          )
        }
        if (isRapportPart(part)) {
          return (
            <RapportOf
              key={index}
              part={part}
              isStreaming={state !== null}
              llmCallId={message.metadata?.llmCallId}
            />
          )
        }
        return null
      })}
      {/* Sous le texte, une fois la réponse rédigée : l'encart ferme la réponse. */}
      {state === null && help && <CentreAideEncart output={help} />}
      {/* Les choix ferment la réponse, même si le modèle a écrit après l'appel. */}
      {showChoices &&
        message.parts.map((part, index) =>
          part.type === 'tool-clarify_with_choices' &&
          part.state === 'output-available' &&
          !('error' in part.output) ? (
            <ChoicesInline
              key={index}
              question={part.output.question}
              choices={part.output.choices}
              onChoose={onChoose}
              onWriteOther={onWriteOther}
            />
          ) : null,
        )}
      {actions}
    </div>
  )
})
