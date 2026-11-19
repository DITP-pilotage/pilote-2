import { UncomputedExplanation } from '@/components/axes-croises/UncomputedExplanation'
import { fonctionLabel, formatValue, formulaOf, pluralSuffix } from '@/lib/axeArbre'
import { type AxeCroise, type CelluleCroisee, type CelluleIds } from '@/lib/axesCroises'

export function CroisementExplanation({
  axes,
  cellule,
  resolve,
}: {
  axes: ReadonlyArray<AxeCroise>
  cellule: CelluleCroisee | null
  resolve: (ids: CelluleIds) => CelluleCroisee
}) {
  if (!cellule) {
    return (
      <span className="text-text-muted">
        Cliquez sur une cellule pour voir comment le moteur la calcule : ses sources s’allument en
        bleu.
      </span>
    )
  }
  if (cellule.descendedAxe === null) {
    return <UncomputedExplanation cellule={cellule} />
  }
  const index = cellule.descendedAxe
  const axe = axes[index]
  if (!axe) return null
  const children = cellule.children.map((ids) => {
    const id = ids[index] ?? ''
    return { nom: axe.arbre.get(id)?.nom ?? id, cellule: resolve(ids) }
  })
  const terms = children.flatMap((child) =>
    child.cellule.value === null ? [] : [`${child.nom} ${formatValue(child.cellule.value)}`],
  )
  const ignored = children.filter((child) => child.cellule.statut === 'absente')
  return (
    <span className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="text-xs text-text-muted">
        On descend <b className="text-text">{axe.nom}</b> (axe {index + 1}, le dernier déclaré
        encore à préciser), en {fonctionLabel(axe.fonction)} :
      </span>
      <span className="font-mono text-xs">
        = {terms.length === 0 ? '∅' : formulaOf({ terms, fonction: axe.fonction })}
        {cellule.value === null ? null : (
          <strong className="text-sm"> = {formatValue(cellule.value)}</strong>
        )}
      </span>
      {ignored.length > 0 ? (
        <span className="text-xs text-text-subtle">
          ignorée{pluralSuffix(ignored.length)} (jamais saisie{pluralSuffix(ignored.length)}) :{' '}
          {ignored.map((child) => child.nom).join(', ')}
        </span>
      ) : null}
    </span>
  )
}
