import { type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'

import { clsxm } from '@/lib/clsxm'
import { formatNumberFr } from '@/lib/format'

type PositionRelativeProps = {
  min: number | null
  mediane: number | null
  max: number | null
  valeur: number | null
  unite: UniteIndicateurApiModel | null
}

// Deux centres de label plus proches que ce seuil (en % de la piste) se
// chevaucheraient : on décale alors le label « Actuel » sur une 2ᵉ ligne.
const SEUIL_CHEVAUCHEMENT_PCT = 14

type Align = 'start' | 'center' | 'end'

const alignToTranslate: Record<Align, string> = {
  start: 'translateX(0)',
  center: 'translateX(-50%)',
  end: 'translateX(-100%)',
}

const alignToItems: Record<Align, string> = {
  start: 'items-start text-left',
  center: 'items-center text-center',
  end: 'items-end text-right',
}

function ValeurUnite({
  value,
  unite,
  primary,
}: {
  value: number
  unite: UniteIndicateurApiModel | null
  primary?: boolean
}) {
  return (
    <span
      className={clsxm('text-sm font-bold tabular-nums', primary ? 'text-primary' : 'text-text')}
    >
      {formatNumberFr(value)}
      {unite?.abbreviation && (
        <span
          className={clsxm(
            'ml-0.5 text-[11px] font-medium',
            primary ? 'text-primary/70' : 'text-text-subtle',
          )}
        >
          {unite.abbreviation}
        </span>
      )}
    </span>
  )
}

function Marker({ pct, className }: { pct: number; className: string }) {
  return (
    <span
      aria-hidden
      className={clsxm(
        'absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-surface shadow-[0_0_0_1px_rgba(0,0,20,0.08)]',
        className,
      )}
      style={{ left: `${pct}%` }}
    />
  )
}

function PosLabel({
  left,
  align,
  tag,
  value,
  unite,
  primary = false,
  secondRow = false,
  caret = false,
}: {
  left: string
  align: Align
  tag: string
  value: number
  unite: UniteIndicateurApiModel | null
  primary?: boolean
  secondRow?: boolean
  caret?: boolean
}) {
  return (
    <div
      className={clsxm('absolute flex flex-col gap-1', alignToItems[align])}
      style={{ left, transform: alignToTranslate[align], top: secondRow ? '2.5rem' : 0 }}
    >
      {caret && (
        <span
          aria-hidden
          className="size-0 border-x-4 border-b-4 border-x-transparent border-b-primary"
        />
      )}
      <span
        className={clsxm(
          'text-[11px] font-bold uppercase tracking-[0.04em]',
          primary ? 'text-primary' : 'text-text-subtle',
        )}
      >
        {tag}
      </span>
      <ValeurUnite value={value} unite={unite} primary={primary} />
    </div>
  )
}

// Jauge « position relative » : min / médiane / max posés sur la piste + point
// courant. Gère les edge-cases (spread nul, données manquantes, chevauchement
// du label « Actuel » avec une ancre) pour éviter les superpositions.
export function PositionRelative({ min, mediane, max, valeur, unite }: PositionRelativeProps) {
  if (min === null || max === null) {
    return <p className="text-xs text-text-subtle">Position relative indisponible.</p>
  }

  const spread = max - min

  // Spread nul : min = max, la barre n'a pas de sens → rendu dégradé.
  if (spread <= 0) {
    return (
      <div>
        <div className="relative h-1.5 rounded-full bg-border-strong">
          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 z-10 size-[17px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface bg-primary"
          />
        </div>
        <div className="mt-4 flex flex-col items-center gap-1 text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-text-subtle">
            Min = Méd. = Max
          </span>
          <ValeurUnite value={max} unite={unite} />
        </div>
      </div>
    )
  }

  const pct = (v: number) => Math.min(100, Math.max(0, ((v - min) / spread) * 100))
  const pctMed = mediane === null ? null : pct(mediane)
  const pctCur = valeur === null ? null : pct(valeur)

  // Résolution de chevauchement du label « Actuel » : s'il tombe près d'un bord
  // (Min/Max) ou de la médiane, on le pousse sur une 2ᵉ ligne (le point, lui,
  // reste à sa position réelle — on ne déplace jamais le point).
  const nearLeft = pctCur !== null && pctCur < SEUIL_CHEVAUCHEMENT_PCT
  const nearRight = pctCur !== null && pctCur > 100 - SEUIL_CHEVAUCHEMENT_PCT
  const nearMed =
    pctCur !== null && pctMed !== null && Math.abs(pctCur - pctMed) < SEUIL_CHEVAUCHEMENT_PCT
  const actuelSecondRow = Boolean(pctCur !== null && (nearLeft || nearRight || nearMed))
  const actuelAlign: Align = nearLeft ? 'start' : nearRight ? 'end' : 'center'

  return (
    <div>
      <div className="relative h-1.5 rounded-full bg-border-strong">
        <Marker pct={0} className="bg-accent-rouge" />
        {pctMed !== null && <Marker pct={pctMed} className="bg-text-subtle" />}
        <Marker pct={100} className="bg-success" />
        {pctCur !== null && (
          <span
            aria-hidden
            className="absolute top-1/2 z-10 size-[17px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface bg-primary shadow-[0_0_0_1px_var(--color-primary-tinted)]"
            style={{ left: `${pctCur}%` }}
          />
        )}
      </div>

      <div className="relative mt-4" style={{ minHeight: actuelSecondRow ? '5.25rem' : '2.75rem' }}>
        <PosLabel left="0%" align="start" tag="Min" value={min} unite={unite} />
        {pctMed !== null && mediane !== null && (
          <PosLabel left={`${pctMed}%`} align="center" tag="Méd." value={mediane} unite={unite} />
        )}
        <PosLabel left="100%" align="end" tag="Max" value={max} unite={unite} />
        {pctCur !== null && valeur !== null && (
          <PosLabel
            left={`${pctCur}%`}
            align={actuelAlign}
            tag="Actuel"
            value={valeur}
            unite={unite}
            primary
            secondRow={actuelSecondRow}
            caret={!actuelSecondRow}
          />
        )}
      </div>
    </div>
  )
}
