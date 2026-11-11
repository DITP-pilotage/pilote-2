import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { memo, type ReactNode } from 'react'

import { AssistantSignature } from './AssistantSignature'
import { ChoicesInline } from './ChoicesInline'
import { ConsultedSources, isSourcePart } from './ConsultedSources'
import { type AssistantState } from './deriveAssistantState'
import { MarkdownResponse } from './MarkdownResponse'

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

  return (
    <div className="flex w-full flex-col gap-3 text-[15px] leading-6 text-text">
      <AssistantSignature state={state} />
      {sources.length > 0 && <ConsultedSources parts={sources} />}
      {message.parts.map((part, index) =>
        part.type === 'text' && part.text.length > 0 ? (
          <MarkdownResponse key={index} text={part.text} />
        ) : null,
      )}
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
