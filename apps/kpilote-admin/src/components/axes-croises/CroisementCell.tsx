import { formatValue } from '@/lib/axeArbre'
import { type CelluleCroisee } from '@/lib/axesCroises'
import { clsxm } from '@/lib/clsxm'
import { type Emphasis, strongerEmphasis, type Tone } from '@/lib/croisementTable'
import { EMPHASIS_CLASS } from '@/components/axes-croises/emphasisClass'

const TONE_CLASS: Record<Tone, string> = {
  active: 'relative z-10 outline-2 -outline-offset-2 outline-primary',
  precedent: 'bg-primary-tinted',
}

export function CroisementCell({
  cellule,
  emphasis,
  saisie,
  tone,
  label,
  onActivate,
  onSaisie,
}: {
  cellule: CelluleCroisee
  emphasis: Emphasis
  saisie: string
  tone: Tone | undefined
  label: string
  onActivate: () => void
  onSaisie: (value: string) => void
}) {
  const isIncomplete = cellule.present < cellule.expected
  // Une case calculée reste teintée même entre deux feuilles : un axe fixé sur une parente.
  const cellEmphasis = cellule.isSaisissable
    ? emphasis
    : strongerEmphasis({ first: emphasis, second: 1 })
  return (
    <td
      className={clsxm(
        'h-8 min-w-32 border-r border-b border-border p-0 text-right tabular-nums',
        EMPHASIS_CLASS[cellEmphasis],
        cellule.statut === 'absente' && 'font-normal text-text-subtle',
        tone && TONE_CLASS[tone],
      )}
    >
      {cellule.isSaisissable ? (
        <input
          value={saisie}
          onFocus={onActivate}
          onChange={(event) => onSaisie(event.target.value)}
          placeholder="·"
          inputMode="decimal"
          aria-label={label}
          className="h-full w-full bg-transparent px-3 text-right tabular-nums outline-none placeholder:text-text-subtle"
        />
      ) : (
        <button
          type="button"
          onClick={onActivate}
          className="flex h-full w-full items-center justify-end gap-1 px-3"
        >
          {isIncomplete ? (
            <span className="text-[10px] font-normal text-warning-425">
              {cellule.present}/{cellule.expected}
            </span>
          ) : null}
          {cellule.value === null ? '·' : formatValue(cellule.value)}
        </button>
      )}
    </td>
  )
}
