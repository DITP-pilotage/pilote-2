import { type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { type DernierTauxProgressionApiModel } from '@pilote/kpilote-shared/valeurAvancement'

import { IndicateurProgression } from '@/components/indicateurs/IndicateurProgression'
import { Text } from '@pilote/kpilote-ui/Typography'

// Sans cible, le bloc garde sa place et sa forme (barre vide) : les blocs qui
// suivent restent alignés d'une carte à l'autre. « Pas de cible attendue » et
// « Cible attendue non renseignée » se distingueront avec PIL-2004.
export function IndicateurCardCible({
  dernierTaux,
  unite,
}: {
  dernierTaux: DernierTauxProgressionApiModel | null
  unite: UniteIndicateurApiModel | null
}) {
  if (dernierTaux) {
    return (
      <IndicateurProgression
        taux={dernierTaux.tauxProgression}
        valeurCible={dernierTaux.valeurCible}
        dateCible={dernierTaux.dateCible}
        unite={unite}
      />
    )
  }
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Text variant="kicker" tone="muted" as="p">
          Progression
        </Text>
        <span className="text-sm font-bold text-text-muted">-</span>
      </div>
      <div aria-hidden="true" className="mt-2 h-2 rounded-full bg-text-muted/20" />
      <div className="mt-2 text-right">
        <Text variant="caption" tone="muted">
          Pas de cible
        </Text>
      </div>
    </div>
  )
}
