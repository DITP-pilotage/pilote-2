import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { TOOLS, type KpiloteUITools } from '@pilote/kpilote-shared/assistant/tools'
import { clsxm } from '@pilote/kpilote-ui/clsxm'
import { isToolUIPart, type ToolUIPart } from 'ai'
import { Check, LoaderCircle, TriangleAlert } from 'lucide-react'
import { memo, useState } from 'react'

import { toolNameOf } from './deriveAssistantState'
import { sourceState } from './sourceState'

export type SourceToolPart = ToolUIPart<KpiloteUITools>

export const isSourcePart = (part: KpiloteUIMessage['parts'][number]): part is SourceToolPart => {
  if (!isToolUIPart(part)) return false
  const name = toolNameOf(part.type)
  // Comme sur PPG, la consultation du centre d'aide figure parmi les sources.
  return name !== null && (TOOLS[name].kind === 'source' || TOOLS[name].kind === 'help')
}

const labelOf = (part: SourceToolPart) => {
  const name = toolNameOf(part.type)
  return name ? TOOLS[name].label : part.type
}

function StateIcon({ part }: { part: SourceToolPart }) {
  const state = sourceState(part)
  if (state === 'failed') return <TriangleAlert className="size-3.5 text-error" />
  if (state === 'done') return <Check className="size-3.5 text-success" />
  return <LoaderCircle className="size-3.5 animate-spin text-primary" />
}

const formatValue = (value: unknown): string =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : JSON.stringify(value)

function SourceDetail({ part }: { part: SourceToolPart }) {
  const params = Object.entries(
    typeof part.input === 'object' && part.input !== null ? part.input : {},
  )
  const output =
    part.state === 'output-available'
      ? part.output
      : part.state === 'output-error'
        ? part.errorText
        : undefined

  return (
    <div className="border border-border text-xs leading-[18px] text-text-muted">
      <div className="flex items-center gap-2 border-b border-border bg-surface-muted px-3 py-2 font-bold text-text">
        <StateIcon part={part} />
        {labelOf(part)}
      </div>
      {params.length > 0 && (
        <dl className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-1 px-3 py-2.5">
          {params.map(([key, value]) => (
            <div className="contents" key={key}>
              <dt className="text-text-subtle">{key}</dt>
              <dd className="m-0 break-words">{formatValue(value)}</dd>
            </div>
          ))}
        </dl>
      )}
      {output !== undefined && (
        <details className="border-t border-border px-3 py-2">
          <summary className="cursor-pointer font-medium text-primary">
            Voir la réponse brute
          </summary>
          <pre className="mt-2 max-h-60 overflow-auto bg-surface-muted p-2 text-[11px] leading-4 text-text">
            {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}

/** Une pastille par outil de données appelé, détail au clic : le comportement de PPG. */
export const ConsultedSources = memo(function ConsultedSources({
  parts,
}: {
  parts: SourceToolPart[]
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const allDone = parts.every((part) => sourceState(part) !== 'running')
  const openPart = parts.find((part) => part.toolCallId === openId)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 text-[13px] leading-5 text-text-subtle">
        {allDone && (
          <span>
            {parts.length} {parts.length > 1 ? 'sources consultées' : 'source consultée'}
          </span>
        )}
        {parts.map((part) => (
          <button
            key={part.toolCallId}
            type="button"
            aria-expanded={part.toolCallId === openId}
            onClick={() =>
              setOpenId((current) => (current === part.toolCallId ? null : part.toolCallId))
            }
            className={clsxm(
              'inline-flex h-[26px] items-center gap-1.5 border bg-surface-muted px-2 text-xs font-medium text-text transition-colors hover:border-border-strong',
              sourceState(part) === 'failed' ? 'border-error bg-error-tinted' : 'border-border',
              part.toolCallId === openId && 'border-primary text-primary',
            )}
          >
            <StateIcon part={part} />
            {labelOf(part)}
          </button>
        ))}
      </div>
      {openPart && <SourceDetail part={openPart} />}
    </div>
  )
})
