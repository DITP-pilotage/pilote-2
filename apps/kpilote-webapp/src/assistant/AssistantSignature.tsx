import { Sparkles } from 'lucide-react'

import { ASSISTANT_STATE_LABELS, type AssistantState } from './deriveAssistantState'

export const ASSISTANT_NAME = 'Assistant kpilote'

function LoadingDots() {
  return (
    <span aria-hidden className="inline-flex gap-0.5">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="size-1.5 animate-pulse bg-primary motion-reduce:animate-none"
          style={{ animationDelay: `${index * 150}ms` }}
        />
      ))}
    </span>
  )
}

export function AssistantSignature({ state }: { state: AssistantState | null }) {
  return (
    <div className="flex items-center gap-2 text-xs leading-5 text-text-subtle">
      <span className="grid size-6 place-items-center bg-primary text-primary-foreground">
        <Sparkles className="size-3.5" />
      </span>
      {state ? (
        <>
          <span aria-live="polite">
            L&apos;{ASSISTANT_NAME} {ASSISTANT_STATE_LABELS[state]}
          </span>
          <LoadingDots />
        </>
      ) : (
        <span className="font-bold text-text">{ASSISTANT_NAME}</span>
      )}
    </div>
  )
}
