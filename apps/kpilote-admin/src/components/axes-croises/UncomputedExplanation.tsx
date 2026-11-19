import { type CelluleCroisee } from '@/lib/axesCroises'

export function UncomputedExplanation({ cellule }: { cellule: CelluleCroisee }) {
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
