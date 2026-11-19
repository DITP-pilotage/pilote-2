import { type FonctionAgregationAxe } from '@pilote/kpilote-shared/axe'

import { FeuilleExplanation } from '@/components/axe-graphe/FeuilleExplanation'
import { type Arbre, type ArbreNode, formatValue, formulaOf, pluralSuffix } from '@/lib/axeArbre'
import { type Cellule, type SaisiesSerie } from '@/lib/axeSerie'
import { explainChildren, lastSaisieBefore } from '@/lib/axeTableur'

export function TableurExplanation({
  arbre,
  node,
  index,
  fonction,
  saisies,
  serie,
}: {
  arbre: Arbre
  node: ArbreNode
  index: number
  fonction: FonctionAgregationAxe
  saisies: SaisiesSerie
  serie: Map<string, Cellule[]>
}) {
  const cellule = serie.get(node.id)?.[index]
  if (!cellule) return null
  if (node.kind === 'feuille') {
    return (
      <FeuilleExplanation
        cellule={cellule}
        index={index}
        source={lastSaisieBefore({ saisies: saisies[node.id], index })}
      />
    )
  }

  const { terms, missing, ignored, isEmpty } = explainChildren({ arbre, node, index, serie })
  if (isEmpty) {
    return (
      <span className="text-text-muted">
        Aucun enfant saisi : elle n’existe pas pour cet individu.
      </span>
    )
  }
  return (
    <span className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="font-mono text-xs">
        = {terms.length === 0 ? '∅' : formulaOf({ terms, fonction })}
        {cellule.value === null ? null : (
          <strong className="text-sm"> = {formatValue(cellule.value)}</strong>
        )}
      </span>
      <span className="text-xs text-text-muted">
        couverture {cellule.present}/{cellule.expected}
      </span>
      {missing.length > 0 ? (
        <span className="text-xs text-warning">
          manquante{pluralSuffix(missing.length)} :{' '}
          {missing.map((child) => child.node.nom).join(', ')}
        </span>
      ) : null}
      {ignored.length > 0 ? (
        <span className="text-xs text-text-subtle">
          ignorée{pluralSuffix(ignored.length)} (jamais saisie{pluralSuffix(ignored.length)}) :{' '}
          {ignored.map((child) => child.node.nom).join(', ')}
        </span>
      ) : null}
    </span>
  )
}
