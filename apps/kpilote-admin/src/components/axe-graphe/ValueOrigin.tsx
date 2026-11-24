import { type FonctionAgregationAxe } from '@pilote/kpilote-shared/axe'

import { ModaliteChip } from '@/components/axe-graphe/ModaliteChip'
import {
  type ArbreNode,
  fonctionLabel,
  formatValue,
  formulaOf,
  pluralizeCount,
} from '@/lib/axeArbre'
import { type Cellule } from '@/lib/axeSerie'

export function ValueOrigin({
  node,
  childNodes,
  isSimulating,
  fonction,
  valeurs,
  onSelect,
}: {
  node: ArbreNode
  childNodes: ReadonlyArray<ArbreNode>
  isSimulating: boolean
  fonction: FonctionAgregationAxe
  valeurs: Map<string, Cellule>
  onSelect: (id: string) => void
}) {
  if (node.kind === 'feuille') {
    return (
      <p className="text-text-muted">
        Elle est <strong className="text-text">saisie</strong> directement, pour chaque individu et
        chaque date. Rien ne la calcule.
      </p>
    )
  }
  if (childNodes.length === 0) {
    return <p className="text-text-muted">Aucune modalité : rien à calculer pour l’instant.</p>
  }
  const valeurOf = (id: string) => {
    const value = valeurs.get(id)?.value
    return value === null || value === undefined ? '∅' : formatValue(value)
  }
  const hasAbsentChild = childNodes.some((child) => valeurs.get(child.id)?.value == null)
  return (
    <>
      <p className="text-text-muted">
        Jamais saisie : c’est la{' '}
        <strong className="text-text">
          {isSimulating ? fonctionLabel(fonction) : 'somme ou la moyenne'}
        </strong>{' '}
        de ses {pluralizeCount({ count: childNodes.length, word: 'enfant' })}
        {isSimulating ? '' : ', selon l’indicateur'}.
      </p>
      <div className="rounded-md bg-surface-muted px-3 py-2 font-mono text-xs leading-relaxed text-text">
        <div>
          {node.nom} = {formulaOf({ terms: childNodes.map((child) => child.nom), fonction })}
        </div>
        {isSimulating ? (
          <>
            <div className="text-text-muted">
              = {formulaOf({ terms: childNodes.map((child) => valeurOf(child.id)), fonction })}
            </div>
            <div className="font-semibold">= {valeurOf(node.id)}</div>
          </>
        ) : null}
      </div>
      {isSimulating && hasAbsentChild ? (
        <p className="text-xs text-warning">
          ∅ = absente : elle sort du calcul, elle ne compte pas comme 0.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        {childNodes.map((child) => (
          <ModaliteChip key={child.id} node={child} onSelect={onSelect} />
        ))}
      </div>
    </>
  )
}
