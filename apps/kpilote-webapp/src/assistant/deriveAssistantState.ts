import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { TOOLS, type ToolName } from '@pilote/kpilote-shared/assistant/tools'
import type { ChatStatus } from 'ai'

export type AssistantState =
  | 'thinking'
  | 'consulting-sources'
  | 'consulting-help'
  | 'writing-report'
  | 'composing-dashboard'
  | 'writing'

export const ASSISTANT_STATE_LABELS: Record<AssistantState, string> = {
  thinking: 'réfléchit',
  'consulting-sources': 'consulte les sources',
  'consulting-help': 'consulte le centre d’aide',
  'writing-report': 'rédige la synthèse',
  'composing-dashboard': 'compose le tableau de bord',
  writing: 'rédige',
}

const isToolName = (name: string): name is ToolName => name in TOOLS

export const toolNameOf = (type: string): ToolName | null => {
  const name = type.replace(/^tool-/u, '')
  return isToolName(name) ? name : null
}

/** Ce que fait l'assistant, déduit de la dernière part du message en cours. */
export const deriveAssistantState = ({
  message,
  status,
}: {
  message: KpiloteUIMessage | undefined
  status: ChatStatus
}): AssistantState | null => {
  if (status === 'submitted') return 'thinking'
  if (status !== 'streaming') return null

  const last = message?.parts.at(-1)
  if (!last) return 'thinking'
  if (last.type === 'text') return last.text.length > 0 ? 'writing' : 'thinking'

  const name = toolNameOf(last.type)
  if (!name || !('state' in last)) return 'thinking'
  // Un encart émet ses états au fil de la rédaction : il rédige tant qu'il n'a pas fini.
  if (TOOLS[name].kind === 'report') {
    const output = 'output' in last ? last.output : undefined
    const done = typeof output === 'object' && output !== null && 'done' in output && output.done
    return last.state === 'output-error' || done ? 'thinking' : 'writing-report'
  }
  const running = last.state === 'input-streaming' || last.state === 'input-available'
  if (!running) return 'thinking'
  if (TOOLS[name].kind === 'help') return 'consulting-help'
  if (TOOLS[name].kind === 'dashboard') return 'composing-dashboard'
  return TOOLS[name].kind === 'source' ? 'consulting-sources' : 'thinking'
}
