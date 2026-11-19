import { type FonctionAgregationAxe } from '@pilote/kpilote-shared/axe'

import { AddChildButton } from '@/components/axe-graphe/AddChildButton'
import { KindMarker } from '@/components/axe-graphe/KindMarker'
import { NodeCollapseButton } from '@/components/axe-graphe/NodeCollapseButton'
import { SimulatedValue } from '@/components/axe-graphe/SimulatedValue'
import { NODE_HEIGHT, nodeMetaOf, type PlacedNode } from '@/lib/axeGraphe'
import { type Cellule } from '@/lib/axeSerie'
import { clsxm } from '@/lib/clsxm'

export function GraphNode({
  node,
  width,
  isSelected,
  isDimmed,
  isMatch,
  isSimulating,
  fonction,
  saisie,
  valeur,
  canAddChild,
  locked,
  onHover,
  onSelect,
  onToggle,
  onAddChild,
  onSaisie,
}: {
  node: PlacedNode
  width: number
  isSelected: boolean
  isDimmed: boolean
  isMatch: boolean
  isSimulating: boolean
  fonction: FonctionAgregationAxe
  saisie: string
  valeur: Cellule | undefined
  canAddChild: boolean
  locked: boolean
  onHover: (id: string | null) => void
  onSelect: () => void
  onToggle: (() => void) | undefined
  onAddChild: () => void
  onSaisie: (value: string) => void
}) {
  const isTous = node.kind === 'tous'
  const isCollapsed = node.hidden > 0
  const showAddChild = !isSimulating && canAddChild
  return (
    <div
      className={clsxm('group absolute transition-opacity', isDimmed && 'opacity-30')}
      style={{ left: node.x, top: node.y, width, height: NODE_HEIGHT }}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
    >
      {isCollapsed ? (
        <>
          <span className="absolute inset-0 translate-x-2 translate-y-2 rounded-lg border border-border bg-surface" />
          <span className="absolute inset-0 translate-x-1 translate-y-1 rounded-lg border border-border bg-surface" />
        </>
      ) : null}
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') onSelect()
        }}
        className={clsxm(
          'relative flex h-full cursor-pointer items-stretch overflow-hidden rounded-lg border shadow-sm transition-colors',
          isTous
            ? 'border-text bg-text text-primary-foreground'
            : 'border-border bg-surface hover:border-primary/60',
          isMatch && 'border-primary',
          isSelected && 'ring-2 ring-primary ring-offset-2',
        )}
      >
        {isTous ? null : <KindMarker kind={node.kind} shape="bar" />}
        <div className="flex min-w-0 flex-1 flex-col justify-center px-3">
          <span className={clsxm('truncate text-sm font-medium', !isTous && 'text-text')}>
            {node.nom}
          </span>
          <span
            className={clsxm('truncate text-[11px]', isTous ? 'opacity-70' : 'text-text-muted')}
          >
            {nodeMetaOf({ node, isSimulating, fonction })}
          </span>
        </div>
        {isSimulating ? (
          <div className="flex shrink-0 items-center pr-2.5">
            <SimulatedValue node={node} saisie={saisie} valeur={valeur} onSaisie={onSaisie} />
          </div>
        ) : null}
        {showAddChild ? (
          <div className="flex shrink-0 items-center pr-2">
            <AddChildButton node={node} locked={locked} onAddChild={onAddChild} />
          </div>
        ) : null}
      </div>
      {onToggle ? <NodeCollapseButton node={node} onToggle={onToggle} /> : null}
    </div>
  )
}
