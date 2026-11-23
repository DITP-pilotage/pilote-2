import { type DeclarationAxeIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { type IndividuApiModel } from '@pilote/kpilote-shared/individu'
import { useQueries, type UseQueryResult } from '@tanstack/react-query'
import { useMemo } from 'react'

import { TableauValeursContent } from '@/components/indicateurs/tableau-valeurs/TableauValeursContent'
import { buildNomOfIndividu } from '@/lib/axes/explicationCellule'
import { referentielIndividusQueryOptions } from '@/queries/referentiels'

// Hors du composant : une fonction stable laisse useQueries mémoriser le résultat.
const individusOf = (results: ReadonlyArray<UseQueryResult<ReadonlyArray<IndividuApiModel>>>) =>
  results.flatMap((result) => result.data ?? [])

// Le cube de l'individu affiché, en tableau croisé ou en lignes, en lecture seule. Les axes
// choisis dans les sélecteurs de la page partent fixés sur leur modalité.
export function TableauValeursTab({
  indicateurId,
  individuId,
  referentielIds,
  declarations,
  modalitesFixees,
}: {
  indicateurId: string
  individuId: string
  // Tous les référentiels de l'indicateur : les individus enfants peuvent être dans un autre.
  referentielIds: ReadonlyArray<string>
  declarations: ReadonlyArray<DeclarationAxeIndicateurApiModel>
  // Une entrée par axe déclaré : la modalité choisie, ou `null` pour « Tous ».
  modalitesFixees: ReadonlyArray<string | null>
}) {
  const individus = useQueries({
    queries: referentielIds.map(referentielIndividusQueryOptions),
    combine: individusOf,
  })
  const nomOfIndividu = useMemo(() => buildNomOfIndividu(individus), [individus])
  return (
    <div className="flex h-[calc(100dvh-16rem)] min-h-[32rem] flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <TableauValeursContent
        indicateurId={indicateurId}
        individuId={individuId}
        declarations={declarations}
        nomOfIndividu={nomOfIndividu}
        modalitesFixees={modalitesFixees}
      />
    </div>
  )
}
