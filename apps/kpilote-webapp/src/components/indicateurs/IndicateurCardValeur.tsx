import { type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { type DerniereValeurApiModel } from '@pilote/kpilote-shared/valeurAvancement'

import { Text } from '@pilote/kpilote-ui/Typography'
import { formatMonthYearNumericFr, formatNumberFr } from '@/lib/format'

export function IndicateurCardValeur({
  derniereValeur,
  unite,
}: {
  derniereValeur: DerniereValeurApiModel | null
  unite: UniteIndicateurApiModel | null
}) {
  if (!derniereValeur) {
    return (
      <div>
        <p className="text-3xl font-bold leading-none text-text-muted">-</p>
        <Text variant="caption" tone="muted" className="mt-1">
          Pas de valeur
        </Text>
      </div>
    )
  }
  return (
    <div>
      <p className="text-3xl font-bold leading-none text-text">
        {formatNumberFr(derniereValeur.valeur)}
        {unite?.abbreviation && (
          <span className="ml-1.5 text-sm font-normal text-text-muted">{unite.abbreviation}</span>
        )}
      </p>
      <Text variant="caption" tone="muted" className="mt-1">
        Valeur de {formatMonthYearNumericFr(derniereValeur.date)}
      </Text>
    </div>
  )
}
