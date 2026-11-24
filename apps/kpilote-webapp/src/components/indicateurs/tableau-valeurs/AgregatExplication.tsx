import { type FonctionAgregation } from '@pilote/kpilote-shared/indicateur'
import { type CelluleValeur } from '@pilote/kpilote-shared/valeursCombinaison'
import { Pill } from '@pilote/kpilote-ui/Pill'

import { TermeChip } from '@/components/indicateurs/tableau-valeurs/TermeChip'
import { type TermeAffiche } from '@/lib/axes/explicationCellule'
import { formatMoisAnneeLongFr, formatNumberFr } from '@/lib/format'

const FONCTION_LABEL_CAPITALIZED: Record<FonctionAgregation, string> = {
  SUM: 'Somme',
  AVG: 'Moyenne',
  NONE: 'Valeur',
}

// Une valeur calculée : le résultat et l'opération en une phrase, puis chaque terme.
export function AgregatExplication({
  fonction,
  sujet,
  precision,
  termes,
  cellule,
  dateCalcul,
  periode,
}: {
  fonction: FonctionAgregation
  // Ce que l'on agrège : « 18 individus enfants », « 4 modalités de Opérateur ».
  sujet: string
  precision?: string
  termes: ReadonlyArray<TermeAffiche>
  cellule: CelluleValeur
  dateCalcul: string
  periode: string
}) {
  const isComplete = cellule.present === cellule.expected
  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span>
          {FONCTION_LABEL_CAPITALIZED[fonction]} des {sujet}
          {precision ? <span className="text-xs text-text-muted"> ({precision})</span> : null}
        </span>
        {cellule.value === null ? null : (
          <strong className="text-base tabular-nums">= {formatNumberFr(cellule.value)}</strong>
        )}
        <Pill tone={isComplete ? 'neutral' : 'warning'} className="px-2 py-0.5 font-medium">
          {cellule.present} sur {cellule.expected} avec une valeur
        </Pill>
        {dateCalcul === periode ? null : (
          <span className="text-xs text-text-subtle">
            inchangée depuis {formatMoisAnneeLongFr(dateCalcul)}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-text-muted">Contributions</span>
        <ul className="m-0 flex flex-wrap gap-1.5 p-0">
          {termes.map((terme) => (
            <TermeChip key={terme.key} terme={terme} />
          ))}
        </ul>
      </div>
    </div>
  )
}
