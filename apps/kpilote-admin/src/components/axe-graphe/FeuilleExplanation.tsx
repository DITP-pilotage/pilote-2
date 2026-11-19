import { formatValue } from '@/lib/axeArbre'
import { type Cellule, PERIODES } from '@/lib/axeSerie'

export function FeuilleExplanation({
  cellule,
  index,
  source,
}: {
  cellule: Cellule
  index: number
  source: number | null
}) {
  const periode = PERIODES[index]
  switch (cellule.statut) {
    case 'saisie':
      return (
        <span>
          Saisie : {formatValue(cellule.value ?? 0)}. C’est une feuille, rien ne la calcule.
        </span>
      )
    case 'reportee':
      return (
        <span>
          Rien de saisi en {periode} : la dernière valeur connue
          {source === null ? '' : ` (${PERIODES[source]})`},{' '}
          <strong>{formatValue(cellule.value ?? 0)}</strong>, est reportée.
        </span>
      )
    case 'manquante':
      return (
        <span className="text-warning">
          Saisie à d’autres périodes, donc attendue, mais pas encore de valeur en {periode} : elle
          manque, et la couverture de ses parents baisse.
        </span>
      )
    default:
      return (
        <span className="text-text-muted">
          Jamais saisie : elle n’existe pas pour cet individu. Elle ne compte ni comme 0, ni comme
          une valeur manquante.
        </span>
      )
  }
}
