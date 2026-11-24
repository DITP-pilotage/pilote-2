import {
  type EtapePlan,
  type PlanImpossibleError,
  type PlanTransformation,
  type TableauSource,
} from '@pilote/kpilote-shared/valeurImport'
import { type QueryClient, queryOptions, skipToken } from '@tanstack/react-query'

import { streamPlanImport } from '@/api/planImport'

export type PlanImportResult =
  { ok: true; plan: PlanTransformation } | { ok: false; erreur: PlanImpossibleError }

const ASSISTANT_INDISPONIBLE: PlanImportResult = {
  ok: false,
  erreur: {
    type: 'FICHIER_INEXPLOITABLE',
    motif: 'ASSISTANT_INDISPONIBLE',
    explication:
      'L’assistant IA n’a pas pu lire ce fichier. Réessayez dans un instant, ou mettez le fichier au format attendu.',
  },
}

const NO_ETAPES: EtapePlan[] = []

const etapesKey = ({ indicateurId, fileKey }: { indicateurId: string; fileKey: string | null }) =>
  ['plan-import', indicateurId, fileKey, 'etapes'] as const

// Étapes déjà diffusées par la construction du plan en cours. Cette entrée du
// cache n'a pas de requête à elle : `planImportQueryOptions` l'alimente.
export const planImportEtapesQueryOptions = (params: {
  indicateurId: string
  fileKey: string | null
}) =>
  queryOptions({
    queryKey: etapesKey(params),
    queryFn: () => NO_ETAPES,
    initialData: NO_ETAPES,
    enabled: false,
    staleTime: Infinity,
  })

// Construction du plan par Albert. `tableau` nul : requête désactivée, l'appelant
// ne l'active que pour un fichier hors format standard. Un échec (fichier
// inexploitable, Albert injoignable) est un état attendu : la queryFn le renvoie
// au lieu de lever, sans nouvelle tentative.
export const planImportQueryOptions = ({
  queryClient,
  indicateurId,
  fileKey,
  tableau,
  nomFichier,
}: {
  queryClient: QueryClient
  indicateurId: string
  fileKey: string | null
  tableau: TableauSource | null
  nomFichier: string | null
}) =>
  queryOptions({
    queryKey: ['plan-import', indicateurId, fileKey],
    queryFn: tableau
      ? async ({ signal }): Promise<PlanImportResult> => {
          const etapes: EtapePlan[] = []
          const key = etapesKey({ indicateurId, fileKey })
          queryClient.setQueryData(key, NO_ETAPES)
          try {
            const events = streamPlanImport({
              indicateurId,
              tableau,
              nomFichier: nomFichier ?? '',
              signal,
            })
            for await (const event of events) {
              if (event.type === 'PLAN') return { ok: true, plan: event.plan }
              if (event.type === 'ECHEC') return { ok: false, erreur: event.erreur }
              etapes.push(event.etape)
              queryClient.setQueryData(key, [...etapes])
            }
          } catch (error) {
            // Fermeture de la modale : la requête est annulée, pas en échec.
            if (signal.aborted) throw error
            return ASSISTANT_INDISPONIBLE
          }
          return ASSISTANT_INDISPONIBLE
        }
      : skipToken,
    retry: false,
    staleTime: Infinity,
  })
