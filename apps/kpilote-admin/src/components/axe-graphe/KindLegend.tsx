import { KindMarker } from '@/components/axe-graphe/KindMarker'
import { type Kind } from '@/lib/axeArbre'

const KIND_LEGEND: ReadonlyArray<{ kind: Kind; label: string }> = [
  { kind: 'feuille', label: 'Feuille (saisie)' },
  { kind: 'parente', label: 'Parente (calculée)' },
  { kind: 'tous', label: 'Tous' },
]

export function KindLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-text-muted">
      {KIND_LEGEND.map(({ kind, label }) => (
        <span key={kind} className="inline-flex items-center gap-1.5">
          <KindMarker kind={kind} shape="large-dot" />
          {label}
        </span>
      ))}
    </div>
  )
}
