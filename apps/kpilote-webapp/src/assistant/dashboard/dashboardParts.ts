import type { DashboardOutput } from '@pilote/kpilote-shared/assistant/dashboard'
import type { KpiloteUIMessage } from '@pilote/kpilote-shared/assistant/message'

type MessagePart = KpiloteUIMessage['parts'][number]

export type DashboardPart = Extract<MessagePart, { type: 'tool-create_dashboard' }>

export const isDashboardPart = (part: MessagePart): part is DashboardPart =>
  part.type === 'tool-create_dashboard'

/** Le dashboard composé, ou `null` tant qu'il ne l'est pas ou s'il a été refusé. */
export const dashboardOutput = (part: DashboardPart): DashboardOutput | null =>
  part.state === 'output-available' && !('error' in part.output) ? part.output : null

/** Le premier dashboard composé d'un message : c'est lui que « Copier l'image » copie. */
export const firstDashboard = (message: KpiloteUIMessage): DashboardPart | null =>
  message.parts.find(
    (part): part is DashboardPart => isDashboardPart(part) && dashboardOutput(part) !== null,
  ) ?? null

export const hasDashboard = (message: KpiloteUIMessage): boolean => firstDashboard(message) !== null

/** Repère le rendu d'un dashboard dans la page, pour la copie en image. */
export const dashboardElementAttribute = (toolCallId: string) => ({
  'data-dashboard': toolCallId,
})

export const findDashboardElement = (toolCallId: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`[data-dashboard="${CSS.escape(toolCallId)}"]`)
