import { KindMarker } from '@/components/axe-graphe/KindMarker'
import { type ArbreNode } from '@/lib/axeArbre'
import { clsxm } from '@/lib/clsxm'

export function ModaliteChip({
  node,
  onSelect,
}: {
  node: ArbreNode
  onSelect: (id: string) => void
}) {
  const isTous = node.kind === 'tous'
  return (
    <button
      type="button"
      onClick={() => onSelect(node.id)}
      className={clsxm(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        isTous
          ? 'border-text bg-text text-primary-foreground'
          : 'border-border bg-surface text-text hover:border-primary',
      )}
    >
      {isTous ? null : <KindMarker kind={node.kind} />}
      {node.nom}
    </button>
  )
}
