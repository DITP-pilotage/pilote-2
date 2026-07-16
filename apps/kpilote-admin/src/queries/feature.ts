import type { FeatureEtat } from '@pilote/kpilote-shared/feature'
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import { fetchFeatureById, fetchFeatures, modifierEtatFeature } from '@/api/feature'

export const featuresQueryOptions = () =>
  queryOptions({
    queryKey: ['features'],
    queryFn: () => fetchFeatures(),
  })

export const featureQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['features', id],
    queryFn: () => fetchFeatureById(id),
  })

// Mutation partagée entre la liste (état inline) et la fiche : change l'état
// d'une feature et invalide les queries `features`.
export const useModifierEtatFeatureMutation = (options?: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, etat }: { id: string; etat: FeatureEtat }) => modifierEtatFeature(id, etat),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['features'] })
      options?.onSuccess?.()
    },
    ...(options?.onError ? { onError: options.onError } : {}),
  })
}
