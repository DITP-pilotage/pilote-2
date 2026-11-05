import { clsxm } from '@pilote/kpilote-ui/clsxm'

import type { AssistantView } from './views'

// La place de l'assistant dans l'écran, dessinée dans un rectangle.
const PLACE: Record<AssistantView, { x: number; y: number; width: number; height: number }> = {
  sidePanel: { x: 14, y: 4, width: 7, height: 16 },
  floating: { x: 12, y: 12, width: 6, height: 5 },
  centered: { x: 8, y: 8, width: 8, height: 8 },
  fullscreen: { x: 6, y: 7, width: 12, height: 10 },
}

export function ViewPictogram({ view, className }: { view: AssistantView; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={clsxm('size-[18px] shrink-0', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect height="16" width="18" x="3" y="4" />
      <rect fill="currentColor" stroke="none" {...PLACE[view]} />
    </svg>
  )
}
