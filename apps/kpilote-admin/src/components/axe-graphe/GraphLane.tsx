import { HEADER_HEIGHT } from '@/lib/axeGraphe'
import { clsxm } from '@/lib/clsxm'

export function GraphLane({
  left,
  width,
  isOdd,
  ordre,
  niveauCount,
  niveauNom,
  isSelected,
  onSelect,
}: {
  left: number
  width: number
  isOdd: boolean
  ordre: number
  niveauCount: number
  niveauNom: string
  isSelected: boolean
  onSelect: () => void
}) {
  const isTous = ordre === 0
  const finestSuffix = ordre === niveauCount ? ' · le plus fin' : ''
  return (
    <div
      className={clsxm(
        'absolute top-0 bottom-0 border-r border-border/70',
        isOdd ? 'bg-surface-muted' : 'bg-surface',
        isSelected && 'bg-primary-tinted/40',
      )}
      style={{ left, width }}
    >
      <button
        type="button"
        disabled={isTous}
        onClick={onSelect}
        className={clsxm(
          'sticky top-0 z-10 flex w-full flex-col items-center justify-center border-b border-border/70 bg-inherit text-center',
          !isTous && 'hover:bg-primary-tinted/40',
        )}
        style={{ height: HEADER_HEIGHT }}
      >
        <span className="text-[11px] text-text-subtle">
          {isTous ? 'Résultat' : `Niveau ${ordre}${finestSuffix}`}
        </span>
        <span className="text-sm font-semibold text-text">{niveauNom}</span>
      </button>
    </div>
  )
}
