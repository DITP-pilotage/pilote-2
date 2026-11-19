import { ChevronDown, ChevronRight } from 'lucide-react'

import { KindMarker } from '@/components/axe-graphe/KindMarker'
import { type ArbreNode, TOUS_ID } from '@/lib/axeArbre'
import { clsxm } from '@/lib/clsxm'

export function NodeHeader({
  node,
  isCollapsed,
  onToggle,
  align = 'left',
}: {
  node: ArbreNode
  isCollapsed: boolean
  onToggle: () => void
  align?: 'left' | 'right'
}) {
  const canToggle = node.kind !== 'feuille' && node.children.length > 0
  return (
    <span
      className={clsxm('flex items-center gap-1.5', align === 'right' && 'justify-end')}
      title={node.id === TOUS_ID ? undefined : node.id}
    >
      {canToggle ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? `Déplier ${node.nom}` : `Replier ${node.nom}`}
          className="flex size-5 items-center justify-center rounded text-text-muted hover:bg-surface-muted hover:text-primary"
        >
          {isCollapsed ? (
            <ChevronRight className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </button>
      ) : null}
      <KindMarker kind={node.kind} />
      <span className="truncate">{node.nom}</span>
    </span>
  )
}
