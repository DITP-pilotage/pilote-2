import { type FonctionAgregationAxe } from '@pilote/kpilote-shared/axe'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

import { KindMarker } from '@/components/axe-graphe/KindMarker'
import { fonctionLabel, formatValue, pluralize, pluralSuffix } from '@/lib/axeArbre'
import {
  type GraphLayout,
  HEADER_HEIGHT,
  NODE_HEIGHT,
  type PlacedNode,
  type Selection,
} from '@/lib/axeGraphe'
import { type Cellule } from '@/lib/axeSerie'
import { clsxm } from '@/lib/clsxm'

type GraphCanvasProps = {
  layout: GraphLayout
  depth: number
  niveauCount: number
  niveauNomOf: (ordre: number) => string
  selection: Selection
  selectedNodeId: string | null
  focus: string | null
  highlighted: ReadonlySet<string> | null
  isSearching: boolean
  isSimulating: boolean
  fonction: FonctionAgregationAxe
  saisies: Readonly<Record<string, string>>
  valeurs: Map<string, Cellule>
  canAddChild: (node: PlacedNode) => boolean
  locked: boolean
  onSelectNiveau: (ordre: number) => void
  onSelectNode: (id: string) => void
  onHover: (id: string | null) => void
  onToggle: (id: string) => void
  onAddChild: (node: PlacedNode) => void
  onSaisie: (input: { id: string; value: string }) => void
  onShowAll: (parent: string) => void
}

export function GraphCanvas({
  layout,
  depth,
  niveauCount,
  niveauNomOf,
  selection,
  selectedNodeId,
  focus,
  highlighted,
  isSearching,
  isSimulating,
  fonction,
  saisies,
  valeurs,
  canAddChild,
  locked,
  onSelectNiveau,
  onSelectNode,
  onHover,
  onToggle,
  onAddChild,
  onSaisie,
  onShowAll,
}: GraphCanvasProps) {
  const { placed, extras, laneWidth, nodeWidth, laneX, width, height } = layout
  const lanes = Array.from({ length: depth + 1 }, (_, column) => ({
    column,
    ordre: column === depth ? 0 : depth - column,
  }))
  const edges = [...placed.values()].flatMap((node) => {
    const parent = node.parent ? placed.get(node.parent) : undefined
    return parent ? [{ node, parent }] : []
  })

  return (
    <div className="relative" style={{ width, height, minHeight: '100%' }}>
      {lanes.map(({ column, ordre }) => (
        <Lane
          key={column}
          left={laneX(column)}
          width={laneWidth}
          isOdd={column % 2 === 1}
          ordre={ordre}
          niveauCount={niveauCount}
          niveauNom={ordre === 0 ? 'Tous' : niveauNomOf(ordre)}
          isSelected={selection?.type === 'niveau' && selection.ordre === ordre}
          onSelect={() => onSelectNiveau(ordre)}
        />
      ))}

      <svg
        className="pointer-events-none absolute inset-0"
        width={width}
        height={height}
        aria-hidden
      >
        <defs>
          {(['off', 'on'] as const).map((state) => (
            <marker
              key={state}
              id={`fleche-${state}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path
                d="M0,0 L10,5 L0,10 z"
                className={state === 'on' ? 'fill-primary' : 'fill-border-strong'}
              />
            </marker>
          ))}
        </defs>
        {edges.map(({ node, parent }) => {
          const isOn = focus !== null && !!highlighted?.has(node.id) && highlighted.has(parent.id)
          return (
            <Edge
              key={node.id}
              from={node}
              to={parent}
              nodeWidth={nodeWidth}
              isOn={isOn}
              isDimmed={highlighted !== null && !isOn}
            />
          )
        })}
        {extras.flatMap((more) => {
          const parent = placed.get(more.parent)
          return parent
            ? [
                <Edge
                  key={`more-${more.parent}`}
                  from={more}
                  to={parent}
                  nodeWidth={nodeWidth}
                  isOn={false}
                  isDimmed={highlighted !== null}
                  isDashed
                />,
              ]
            : []
        })}
      </svg>

      {[...placed.values()].map((node) => {
        const canToggle = !isSearching && node.kind !== 'feuille' && node.children.length > 0
        return (
          <GraphNode
            key={node.id}
            node={node}
            width={nodeWidth}
            isSelected={selectedNodeId === node.id}
            isDimmed={highlighted ? !highlighted.has(node.id) : false}
            isMatch={isSearching && node.kind !== 'tous'}
            isSimulating={isSimulating}
            fonction={fonction}
            saisie={saisies[node.id] ?? ''}
            valeur={valeurs.get(node.id)}
            canAddChild={canAddChild(node)}
            locked={locked}
            onHover={onHover}
            onSelect={() => onSelectNode(node.id)}
            onToggle={canToggle ? () => onToggle(node.id) : undefined}
            onAddChild={() => onAddChild(node)}
            onSaisie={(value) => onSaisie({ id: node.id, value })}
          />
        )
      })}

      {extras.map((more) => (
        <button
          key={`more-${more.parent}`}
          type="button"
          onClick={() => onShowAll(more.parent)}
          className={clsxm(
            'absolute flex flex-col items-start justify-center rounded-lg border border-dashed border-border-strong bg-surface/70 px-3 text-left transition-opacity hover:border-primary',
            highlighted && 'opacity-30',
          )}
          style={{ left: more.x, top: more.y, width: nodeWidth, height: NODE_HEIGHT }}
        >
          <span className="text-sm font-medium text-text">
            + {pluralize({ count: more.count, word: 'autre modalité' })}
          </span>
          <span className="text-[11px] text-primary">Tout afficher</span>
        </button>
      ))}
    </div>
  )
}

function Lane({
  left,
  width,
  isOdd,
  ordre,
  niveauCount,
  niveauNom,
  isSelected,
  onSelect,
}: {
  left: number
  width: number
  isOdd: boolean
  ordre: number
  niveauCount: number
  niveauNom: string
  isSelected: boolean
  onSelect: () => void
}) {
  const isTous = ordre === 0
  const finestSuffix = ordre === niveauCount ? ' · le plus fin' : ''
  return (
    <div
      className={clsxm(
        'absolute top-0 bottom-0 border-r border-border/70',
        isOdd ? 'bg-surface-muted' : 'bg-surface',
        isSelected && 'bg-primary-tinted/40',
      )}
      style={{ left, width }}
    >
      <button
        type="button"
        disabled={isTous}
        onClick={onSelect}
        className={clsxm(
          'sticky top-0 z-10 flex w-full flex-col items-center justify-center border-b border-border/70 bg-inherit text-center',
          !isTous && 'hover:bg-primary-tinted/40',
        )}
        style={{ height: HEADER_HEIGHT }}
      >
        <span className="text-[11px] text-text-subtle">
          {isTous ? 'Résultat' : `Niveau ${ordre}${finestSuffix}`}
        </span>
        <span className="text-sm font-semibold text-text">{niveauNom}</span>
      </button>
    </div>
  )
}

function Edge({
  from,
  to,
  nodeWidth,
  isOn,
  isDimmed,
  isDashed = false,
}: {
  from: { x: number; y: number }
  to: { x: number; y: number }
  nodeWidth: number
  isOn: boolean
  isDimmed: boolean
  isDashed?: boolean
}) {
  const startX = from.x + nodeWidth
  const startY = from.y + NODE_HEIGHT / 2
  const endX = to.x - 2
  const endY = to.y + NODE_HEIGHT / 2
  const midX = (startX + endX) / 2
  return (
    <path
      d={`M${startX},${startY} C${midX},${startY} ${midX},${endY} ${endX},${endY}`}
      fill="none"
      markerEnd={`url(#fleche-${isOn ? 'on' : 'off'})`}
      strokeDasharray={isDashed ? '4 4' : undefined}
      className={clsxm(
        'transition-opacity',
        isOn ? 'stroke-primary' : 'stroke-border-strong',
        isDimmed && 'opacity-25',
      )}
      strokeWidth={isOn ? 2 : 1.25}
    />
  )
}

const nodeMetaOf = ({
  node,
  isSimulating,
  fonction,
}: {
  node: PlacedNode
  isSimulating: boolean
  fonction: FonctionAgregationAxe
}): string => {
  if (node.kind === 'feuille') return 'Saisie'
  if (node.children.length === 0) return 'Aucune modalité'
  if (node.hidden > 0) {
    return `${pluralize({ count: node.hidden, word: 'modalité' })} repliée${pluralSuffix(node.hidden)}`
  }
  const operation = isSimulating ? fonctionLabel(fonction) : 'calcul'
  const children = pluralize({ count: node.children.length, word: 'enfant' })
  return `${operation.charAt(0).toUpperCase()}${operation.slice(1)} de ${children}`
}

function GraphNode({
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
            <button
              type="button"
              disabled={locked}
              onClick={(event) => {
                event.stopPropagation()
                onAddChild()
              }}
              title={
                isTous ? 'Ajouter une modalité au niveau 1' : `Ajouter un enfant à ${node.nom}`
              }
              className={clsxm(
                'flex size-6 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 disabled:cursor-not-allowed',
                isTous
                  ? 'text-primary-foreground hover:bg-surface/20'
                  : 'text-primary hover:bg-primary-tinted',
              )}
            >
              <Plus className="size-4" />
            </button>
          </div>
        ) : null}
      </div>
      {onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          title={isCollapsed ? 'Déplier' : 'Replier'}
          className="absolute top-1/2 -left-3 z-10 flex h-6 min-w-6 -translate-y-1/2 items-center justify-center gap-0.5 rounded-full border border-border-strong bg-surface px-1 text-[11px] font-semibold text-text-muted shadow-sm hover:border-primary hover:text-primary"
        >
          {isCollapsed ? (
            <>
              <ChevronLeft className="size-3.5" />
              {node.hidden}
            </>
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </button>
      ) : null}
    </div>
  )
}

function SimulatedValue({
  node,
  saisie,
  valeur,
  onSaisie,
}: {
  node: PlacedNode
  saisie: string
  valeur: Cellule | undefined
  onSaisie: (value: string) => void
}) {
  if (node.kind === 'feuille') {
    return (
      <input
        value={saisie}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onSaisie(event.target.value)}
        placeholder="∅"
        inputMode="decimal"
        aria-label={`Valeur de ${node.nom}`}
        className="w-16 rounded-md border border-border bg-surface px-2 py-1 text-right text-sm text-text tabular-nums placeholder:text-text-subtle focus:border-primary focus:outline-none"
      />
    )
  }
  const isIncomplete = valeur !== undefined && valeur.present < valeur.expected
  return (
    <span className="text-right text-sm font-semibold tabular-nums">
      {valeur?.value == null ? '∅' : formatValue(valeur.value)}
      {isIncomplete ? (
        <span className="block text-[10px] font-normal text-warning-425">
          {valeur.present}/{valeur.expected} présents
        </span>
      ) : null}
    </span>
  )
}
