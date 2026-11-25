import { pluralizeCount } from '@/lib/axeArbre'
import { type MoreNode, NODE_HEIGHT } from '@/lib/axeGraphe'
import { clsxm } from '@/lib/clsxm'

export function MoreModalitesButton({
  more,
  width,
  isDimmed,
  onShowAll,
}: {
  more: MoreNode
  width: number
  isDimmed: boolean
  onShowAll: () => void
}) {
  return (
    <button
      type="button"
      onClick={onShowAll}
      className={clsxm(
        'absolute flex flex-col items-start justify-center rounded-lg border border-dashed border-border-strong bg-surface/70 px-3 text-left transition-opacity hover:border-primary',
        isDimmed && 'opacity-30',
      )}
      style={{ left: more.x, top: more.y, width, height: NODE_HEIGHT }}
    >
      <span className="text-sm font-medium text-text">
        + {pluralizeCount({ count: more.count, word: 'autre modalité' })}
      </span>
      <span className="text-[11px] text-primary">Tout afficher</span>
    </button>
  )
}
