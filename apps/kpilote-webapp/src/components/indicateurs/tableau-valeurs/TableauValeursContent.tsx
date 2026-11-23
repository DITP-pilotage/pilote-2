import { type DeclarationAxeIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { useQuery } from '@tanstack/react-query'
import { HTTPError } from 'ky'
import { useMemo } from 'react'

import { TableauValeurs } from '@/components/indicateurs/tableau-valeurs/TableauValeurs'
import { buildTableauValeursContext, describeChargementError } from '@/lib/axes/tableauValeurs'
import { useAxesWithModalites } from '@/queries/axes'
import { indicateurValeursByCombinaisonQueryOptions } from '@/queries/indicateurs'

const errorDetailOf = (error: Error | null): { status: number | null; body: unknown } =>
  error instanceof HTTPError
    ? { status: error.response.status, body: error.data }
    : { status: null, body: null }

export function TableauValeursContent({
  indicateurId,
  individuId,
  declarations,
  nomOfIndividu,
  modalitesFixees,
}: {
  indicateurId: string
  individuId: string
  declarations: ReadonlyArray<DeclarationAxeIndicateurApiModel>
  nomOfIndividu: (individuId: string) => string
  modalitesFixees: ReadonlyArray<string | null>
}) {
  const axesWithModalites = useAxesWithModalites(declarations)
  // `useQuery` plutôt que la suspense : un refus de l'API (trop de combinaisons) s'affiche
  // dans l’onglet au lieu de remonter jusqu'à l'erreur de la page.
  const { data, isPending, isError, error } = useQuery(
    indicateurValeursByCombinaisonQueryOptions({ indicateurId, individuId }),
  )
  const context = useMemo(
    () =>
      data
        ? buildTableauValeursContext({
            axes: axesWithModalites.map((axe, index) => ({
              ...axe,
              fonction: declarations[index]?.fonction ?? 'SUM',
            })),
            items: data.items,
          })
        : null,
    [axesWithModalites, declarations, data],
  )

  if (isError) {
    return <p className="p-6 text-sm text-error">{describeChargementError(errorDetailOf(error))}</p>
  }
  if (isPending || !context) {
    return <p className="p-6 text-sm text-text-muted">Chargement des valeurs…</p>
  }
  if (context.periodes.length === 0) {
    return <p className="p-6 text-sm text-text-muted">Aucune valeur pour cet individu.</p>
  }
  return (
    <TableauValeurs
      // Changer d'individu repart d'un tableau neuf ; les modalités suivent sans tout réinitialiser.
      key={individuId}
      context={context}
      indicateurId={indicateurId}
      individuId={individuId}
      nomOfIndividu={nomOfIndividu}
      modalitesFixees={modalitesFixees}
    />
  )
}
