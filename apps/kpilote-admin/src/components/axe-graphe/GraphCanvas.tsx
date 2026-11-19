import { type FonctionAgregationAxe } from '@pilote/kpilote-shared/axe'

import { ArrowMarkers } from '@/components/axe-graphe/ArrowMarkers'
import { GraphEdge } from '@/components/axe-graphe/GraphEdge'
import { GraphLane } from '@/components/axe-graphe/GraphLane'
import { GraphNode } from '@/components/axe-graphe/GraphNode'
import { MoreModalitesButton } from '@/components/axe-graphe/MoreModalitesButton'
import {
  edgesOf,
  type GraphLayout,
  lanesOf,
  type PlacedNode,
  type Selection,
} from '@/lib/axeGraphe'
import { type Cellule } from '@/lib/axeSerie'

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

  return (
    <div className="relative" style={{ width, height, minHeight: '100%' }}>
      {lanesOf(depth).map(({ column, ordre }) => (
        <GraphLane
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
        <ArrowMarkers />
        {edgesOf(placed).map(({ node, parent }) => {
          const isOn = focus !== null && !!highlighted?.has(node.id) && highlighted.has(parent.id)
          return (
            <GraphEdge
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
                <GraphEdge
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
        <MoreModalitesButton
          key={`more-${more.parent}`}
          more={more}
          width={nodeWidth}
          isDimmed={highlighted !== null}
          onShowAll={() => onShowAll(more.parent)}
        />
      ))}
    </div>
  )
}
