import { type CelluleValeur } from '@pilote/kpilote-shared/valeursCombinaison'

import { STATUT_CELL_CLASS } from '@/components/indicateurs/tableau-valeurs/statutCellClass'
import { clsxm } from '@/lib/clsxm'

const ITEMS: ReadonlyArray<{ statut: CelluleValeur['statut']; label: string; exemple: string }> = [
  { statut: 'saisie', label: 'Saisie', exemple: '42' },
  { statut: 'reportee', label: 'Reportée', exemple: '↳ 42' },
  { statut: 'manquante', label: 'Pas encore de valeur', exemple: '?' },
  { statut: 'absente', label: 'Jamais saisie', exemple: '·' },
  { statut: 'calculee', label: 'Calculée par l’API', exemple: '84' },
]

export function StatutLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-6 py-2 text-xs text-text-muted">
      {ITEMS.map(({ statut, label, exemple }) => (
        <span key={statut} className="inline-flex items-center gap-1.5">
          <span
            className={clsxm(
              'inline-flex h-5 min-w-9 items-center justify-end rounded-sm border border-border px-1.5 tabular-nums',
              STATUT_CELL_CLASS[statut],
              statut === 'calculee' && 'bg-surface-muted font-semibold',
            )}
          >
            {exemple}
          </span>
          {label}
        </span>
      ))}
      <span className="ml-auto">
        Case blanche : une modalité feuille sur chaque axe ; teintée : agrégat, plus foncée pour «
        Tous ». En orange, le nombre d’enfants qui ont une valeur sur le nombre attendu.
      </span>
    </div>
  )
}
