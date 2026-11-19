import { fonctionLabel, formatValue, formulaOf, pluralSuffix } from '@/lib/axeArbre'
import { type AxeCroise, type CelluleCroisee, type CelluleIds } from '@/lib/axesCroises'

export function CroisementFormulaBar({
  axes,
  reference,
  cellule,
  resolve,
}: {
  axes: ReadonlyArray<AxeCroise>
  reference: string
  cellule: CelluleCroisee | null
  resolve: (ids: CelluleIds) => CelluleCroisee
}) {
  return (
    <div className="flex min-h-12 items-stretch border-b border-border bg-surface text-sm">
      <div className="flex w-72 shrink-0 items-center border-r border-border px-3 text-xs font-medium text-text-muted">
        {reference}
      </div>
      <div className="flex shrink-0 items-center border-r border-border px-3 font-serif text-text-subtle italic">
        fx
      </div>
      <div className="flex min-w-0 flex-1 items-center px-3 py-2 text-text">
        <Explanation axes={axes} cellule={cellule} resolve={resolve} />
      </div>
    </div>
  )
}

function Explanation({
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

function UncomputedExplanation({ cellule }: { cellule: CelluleCroisee }) {
  if (!cellule.isSaisissable) {
    return (
      <span className="text-text-muted">
        Un axe n’a aucune modalité : cette case n’a rien à saisir ni à calculer.
      </span>
    )
  }
  if (cellule.statut === 'absente') {
    return (
      <span className="text-text-muted">
        Combinaison jamais saisie : elle n’existe pas pour cet individu.
      </span>
    )
  }
  return <span>Saisie, sur une feuille de chaque axe : rien ne la calcule.</span>
}
