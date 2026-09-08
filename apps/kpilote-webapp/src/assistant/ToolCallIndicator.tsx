import { TOOL_LABELS, type ToolName } from '@pilote/kpilote-shared/assistant/tools'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@pilote/kpilote-ui/Collapsible'
import type { DynamicToolUIPart, ToolUIPart } from 'ai'
import { Check, ChevronDown, ChevronUp, LoaderCircle, TriangleAlert } from 'lucide-react'
import { memo, useState } from 'react'

// `isToolUIPart` laisse passer les parts `dynamic-tool` : leur nom vit dans `toolName`.
type ToolPart = ToolUIPart | DynamicToolUIPart

const toolLabel = (part: ToolPart): string => {
  const name = (
    part.type === 'dynamic-tool' ? part.toolName : part.type.replace(/^tool-/u, '')
  ) as ToolName
  return TOOL_LABELS[name] ?? name
}

function StatusIcon({ state }: { state: ToolUIPart['state'] }) {
  if (state === 'output-error') return <TriangleAlert className="size-3 text-error" aria-hidden />
  if (state === 'output-available') return <Check className="size-3 text-success" aria-hidden />
  return <LoaderCircle className="size-3 animate-spin" aria-hidden />
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <pre className="mt-1 max-h-64 overflow-auto rounded-md border border-border bg-surface-tinted p-2 font-mono text-[11px] leading-relaxed text-text-muted not-italic">
      {title} : {JSON.stringify(value, null, 2)}
    </pre>
  )
}

/**
 * Un appel d'outil, tel que le SDK le streame : en cours, réussi ou en échec. Une fois
 * terminé, la ligne se déplie sur les paramètres envoyés et le résultat brut — c'est ce
 * qui permet de comprendre pourquoi le modèle a répondu ce qu'il a répondu.
 */
export const ToolCallIndicator = memo(function ToolCallIndicator({ part }: { part: ToolPart }) {
  const [open, setOpen] = useState(false)
  const done = part.state === 'output-available' || part.state === 'output-error'

  return (
    <Collapsible
      open={open && done}
      onOpenChange={setOpen}
      className="text-xs italic text-text-subtle"
    >
      <CollapsibleTrigger
        disabled={!done}
        className="flex items-center gap-1.5 disabled:cursor-default"
        aria-live="polite"
      >
        <StatusIcon state={part.state} />
        <span>{toolLabel(part)}</span>
        {done ? (
          open ? (
            <ChevronUp className="size-3" aria-hidden />
          ) : (
            <ChevronDown className="size-3" aria-hidden />
          )
        ) : null}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <JsonBlock title="Paramètres" value={part.input} />
        {part.state === 'output-error' ? (
          <JsonBlock title="Erreur" value={part.errorText} />
        ) : (
          <JsonBlock title="Résultats" value={part.output} />
        )}
      </CollapsibleContent>
    </Collapsible>
  )
})
