import { type CiblesSaisie } from '@pilote/kpilote-shared/valeurImport'
import { type QueryClient, queryOptions } from '@tanstack/react-query'

import { buildCiblesSaisie } from '@/lib/ciblesSaisie'

import { loadAxesWithModalites } from './axes'
import { indicateurQueryOptions } from './indicateurs'
import { referentielIndividusQueryOptions } from './referentiels'
import { DEFAULT_STALE_TIME } from './utils'

// Aucune route ne renvoie les cibles de saisie : on les recompose depuis
// l'indicateur, les individus de ses référentiels et les modalités de ses axes,
// en passant par le cache de leurs query options.
export const loadCiblesSaisie = async ({
  queryClient,
  indicateurId,
}: {
  queryClient: QueryClient
  indicateurId: string
}): Promise<CiblesSaisie> => {
  const indicateur = await queryClient.ensureQueryData(indicateurQueryOptions(indicateurId))
  const [individusByReferentiel, axes] = await Promise.all([
    Promise.all(
      indicateur.referentiels.map((referentiel) =>
        queryClient.ensureQueryData(referentielIndividusQueryOptions(referentiel.id)),
      ),
    ),
    loadAxesWithModalites({ queryClient, axes: indicateur.axes }),
  ])
  return buildCiblesSaisie({ individus: individusByReferentiel.flat(), axes })
}

export const ciblesSaisieQueryOptions = (indicateurId: string) =>
  queryOptions({
    queryKey: ['indicateur', indicateurId, 'cibles-saisie'],
    // `client` est le QueryClient qui exécute la requête : les trois lectures
    // passent par son cache sans qu'on le donne à la query option.
    queryFn: ({ client }) => loadCiblesSaisie({ queryClient: client, indicateurId }),
    staleTime: DEFAULT_STALE_TIME,
  })
