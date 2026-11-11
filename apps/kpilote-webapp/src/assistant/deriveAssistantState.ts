import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'
import { TOOLS, type ToolName } from '@pilote/kpilote-shared/assistant/tools'
import type { ChatStatus } from 'ai'

export type AssistantState = 'thinking' | 'consulting-sources' | 'writing'

export const ASSISTANT_STATE_LABELS: Record<AssistantState, string> = {
  thinking: 'réfléchit',
  'consulting-sources': 'consulte les sources',
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
  const running = last.state === 'input-streaming' || last.state === 'input-available'
  return running && TOOLS[name].kind === 'source' ? 'consulting-sources' : 'thinking'
}
