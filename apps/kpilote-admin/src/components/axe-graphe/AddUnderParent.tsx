import { Plus } from 'lucide-react'

import { Button } from '@pilote/kpilote-ui/Button'

export function AddUnderParent({
  ordre,
  possibleParents,
  niveauNomOf,
  locked,
  onAdd,
}: {
  ordre: number
  possibleParents: ReadonlyArray<{ id: string; nom: string }>
  niveauNomOf: (ordre: number) => string
  locked: boolean
  onAdd: (parent: string | null) => void
}) {
  if (ordre === 1) {
    return (
      <Button
        size="sm"
        variant="secondary"
        className="self-start"
        disabled={locked}
        onClick={() => onAdd(null)}
      >
        <Plus /> Ajouter une modalité
      </Button>
    )
  }
  if (possibleParents.length === 0) {
    return (
      <p className="text-xs text-text-muted">
        Ajoutez d’abord une modalité au niveau « {niveauNomOf(ordre - 1)} ».
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-text-muted">Ajouter une modalité ici, sous :</span>
      <div className="flex flex-wrap gap-1.5">
        {possibleParents.map((parent) => (
          <button
            key={parent.id}
            type="button"
            disabled={locked}
            onClick={() => onAdd(parent.id)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary/50 px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary-tinted disabled:opacity-50"
          >
            <Plus className="size-3" /> {parent.nom}
          </button>
        ))}
      </div>
    </div>
  )
}
