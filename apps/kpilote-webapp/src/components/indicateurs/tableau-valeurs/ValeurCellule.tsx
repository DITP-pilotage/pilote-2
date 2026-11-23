import { type CelluleValeur } from '@pilote/kpilote-shared/valeursCombinaison'

import { formatNumberFr } from '@/lib/format'

export function ValeurCellule({ cellule }: { cellule: CelluleValeur }) {
  switch (cellule.statut) {
    case 'absente':
      return <span>·</span>
    case 'manquante':
      return <span>?</span>
    case 'reportee':
      return <span>↳ {formatNumberFr(cellule.value ?? 0)}</span>
    case 'saisie':
      return <span>{formatNumberFr(cellule.value ?? 0)}</span>
    case 'calculee':
      return (
        <>
          {cellule.present < cellule.expected ? (
            <span className="text-[10px] font-normal text-warning-425">
              {cellule.present}/{cellule.expected}
            </span>
          ) : null}
          <span>{formatNumberFr(cellule.value ?? 0)}</span>
        </>
      )
  }
}
