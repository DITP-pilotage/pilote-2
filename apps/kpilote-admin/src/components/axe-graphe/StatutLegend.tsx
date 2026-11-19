import { STATUT_CLASS, KIND_ROW_CLASS } from '@/components/axe-graphe/tableurClasses'
import { type CelluleStatut } from '@/lib/axeSerie'
import { clsxm } from '@/lib/clsxm'

const STATUT_LEGEND: ReadonlyArray<{ statut: CelluleStatut; label: string; example: string }> = [
  { statut: 'saisie', label: 'Saisie', example: '42' },
  { statut: 'reportee', label: 'Reportée', example: '↳ 42' },
  { statut: 'manquante', label: 'Manquante', example: '?' },
  { statut: 'absente', label: 'Jamais saisie', example: '·' },
  { statut: 'calculee', label: 'Calculée', example: '84' },
]

export function StatutLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-6 py-2 text-xs text-text-muted">
      {STATUT_LEGEND.map(({ statut, label, example }) => (
        <span key={statut} className="inline-flex items-center gap-1.5">
          <span
            className={clsxm(
              'inline-flex h-5 min-w-9 items-center justify-end rounded-sm border border-border px-1.5 tabular-nums',
              statut === 'calculee' ? KIND_ROW_CLASS.parente : STATUT_CLASS[statut],
            )}
          >
            {example}
          </span>
          {label}
        </span>
      ))}
      <span className="ml-auto">
        Case blanche : saisie ; teintée : calculée, plus foncée pour « Tous ». Un seul individu,
        valeurs d’exemple : rien n’est enregistré.
      </span>
    </div>
  )
}
