import { type FonctionAgregationAxe } from '@pilote/kpilote-shared/axe'

import { TableurExplanation } from '@/components/axe-graphe/TableurExplanation'
import { type Arbre } from '@/lib/axeArbre'
import { type Cellule, PERIODES, type SaisiesSerie } from '@/lib/axeSerie'
import { type CelluleRef } from '@/lib/axeTableur'

export function TableurFormulaBar({
  arbre,
  active,
  fonction,
  saisies,
  serie,
}: {
  arbre: Arbre
  active: CelluleRef | null
  fonction: FonctionAgregationAxe
  saisies: SaisiesSerie
  serie: Map<string, Cellule[]>
}) {
  const node = active ? arbre.get(active.id) : undefined
  const reference = node && active ? `${node.nom} · ${PERIODES[active.index]}` : 'Aucune cellule'
  return (
    <div className="flex min-h-12 items-stretch border-b border-border bg-surface text-sm">
      <div className="flex w-56 shrink-0 items-center border-r border-border px-3 text-xs font-medium text-text-muted">
        {reference}
      </div>
      <div className="flex shrink-0 items-center border-r border-border px-3 font-serif text-text-subtle italic">
        fx
      </div>
      <div className="flex min-w-0 flex-1 items-center px-3 py-2 text-text">
        {node && active ? (
          <TableurExplanation
            arbre={arbre}
            node={node}
            index={active.index}
            fonction={fonction}
            saisies={saisies}
            serie={serie}
          />
        ) : (
          <span className="text-text-muted">
            Cliquez sur une cellule pour voir d’où vient sa valeur : ses sources s’allument en bleu.
          </span>
        )}
      </div>
    </div>
  )
}
