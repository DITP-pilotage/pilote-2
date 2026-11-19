import { formatValue } from '@/lib/axeArbre'
import { type PlacedNode } from '@/lib/axeGraphe'
import { type Cellule } from '@/lib/axeSerie'

export function SimulatedValue({
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
