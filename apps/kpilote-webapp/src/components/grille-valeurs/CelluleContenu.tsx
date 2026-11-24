import { clsxm } from '@/lib/clsxm'
import { type CelluleGrille, type CelluleTone } from '@/lib/grilleValeurs'

const TEXT_CLASS_BY_TONE: Record<CelluleTone, string> = {
  DEFAULT: 'text-text',
  WARNING: 'font-medium text-warning',
  MUTED: 'text-text-muted',
}

export function CelluleContenu({ cellule }: { cellule: CelluleGrille }) {
  const { marker } = cellule
  return (
    <>
      {marker === null ? null : (
        <marker.icon
          aria-label={marker.label}
          className={clsxm(
            'size-3.5 shrink-0',
            cellule.tone === 'WARNING' ? 'text-warning' : 'text-blue-cumulus',
          )}
        />
      )}
      <span
        className={clsxm(
          'truncate',
          TEXT_CLASS_BY_TONE[cellule.tone],
          cellule.alignRight && 'tabular-nums',
        )}
      >
        {cellule.text}
      </span>
      {cellule.identifiant === null ? null : (
        <span className="ml-auto whitespace-nowrap pl-2 font-mono text-[11px] text-text-muted">
          {cellule.identifiant}
        </span>
      )}
    </>
  )
}
