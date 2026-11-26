import { analyticsEvents, type AnalyticsSource } from '@pilote/kpilote-shared/analytics/events'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { analytics } from '@/analytics/tracker'
import { pinIndicateur, unpinIndicateur } from '@/api/indicateurs'
import { apiErrorOf } from '@/lib/apiError'
import { indicateursEpinglesKey } from '@/queries/indicateurs'
import { useToast } from '@pilote/kpilote-ui/Toast'

type EpingleVariables = { indicateurId: string; source: AnalyticsSource }

// Épingler ne change que la section des épinglés : la liste des indicateurs les
// garde tous, épinglés compris.
export function usePinIndicateur() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    meta: { analyticsName: 'indicateur.pin' },
    mutationFn: ({ indicateurId }: EpingleVariables) => pinIndicateur(indicateurId),
    onSuccess: async (_data, { indicateurId, source }) => {
      analytics.trackEvent(analyticsEvents.indicateur.pin({ entity_id: indicateurId, source }))
      await queryClient.invalidateQueries({ queryKey: indicateursEpinglesKey })
      toast({ title: 'Indicateur épinglé.' })
    },
    onError: (error) =>
      toast({
        title: 'Indicateur non épinglé.',
        description: apiErrorOf(error)?.message,
        variant: 'error',
      }),
  })
}

export function useUnpinIndicateur() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    meta: { analyticsName: 'indicateur.unpin' },
    mutationFn: ({ indicateurId }: EpingleVariables) => unpinIndicateur(indicateurId),
    onSuccess: async (_data, { indicateurId, source }) => {
      analytics.trackEvent(analyticsEvents.indicateur.unpin({ entity_id: indicateurId, source }))
      await queryClient.invalidateQueries({ queryKey: indicateursEpinglesKey })
      toast({ title: 'Indicateur désépinglé.' })
    },
    onError: () => toast({ title: 'Indicateur non désépinglé.', variant: 'error' }),
  })
}
