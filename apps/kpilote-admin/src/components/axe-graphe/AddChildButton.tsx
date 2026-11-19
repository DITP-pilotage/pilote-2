import { Plus } from 'lucide-react'

import { type PlacedNode } from '@/lib/axeGraphe'
import { clsxm } from '@/lib/clsxm'

export function AddChildButton({
  node,
  locked,
  onAddChild,
}: {
  node: PlacedNode
  locked: boolean
  onAddChild: () => void
}) {
  const isTous = node.kind === 'tous'
  return (
    <button
      type="button"
      disabled={locked}
      onClick={(event) => {
        event.stopPropagation()
        onAddChild()
      }}
      title={isTous ? 'Ajouter une modalité au niveau 1' : `Ajouter un enfant à ${node.nom}`}
      className={clsxm(
        'flex size-6 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 disabled:cursor-not-allowed',
        isTous
          ? 'text-primary-foreground hover:bg-surface/20'
          : 'text-primary hover:bg-primary-tinted',
      )}
    >
      <Plus className="size-4" />
    </button>
  )
}
