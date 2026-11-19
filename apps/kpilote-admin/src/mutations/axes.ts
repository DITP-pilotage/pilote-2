import { type AxeApiModel, type UpsertAxeBody } from '@pilote/kpilote-shared/axe'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { deleteModalite, upsertAxe, upsertModalite } from '@/api/axes'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'

const useAxeMutationHandlers = (axeId: string) => {
  const queryClient = useQueryClient()
  const toast = useToast()
  return {
    toast,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['axe', axeId] })
      await queryClient.invalidateQueries({ queryKey: ['axes'] })
    },
    onError: (error: unknown) => toast({ title: extractApiError(error), variant: 'error' }),
  }
}

export const useUpsertAxe = (axeId: string) => {
  const { onSuccess, onError } = useAxeMutationHandlers(axeId)
  return useMutation({
    mutationFn: (body: UpsertAxeBody) => upsertAxe({ id: axeId, body }),
    onSuccess,
    onError,
  })
}

export const useUpsertModalite = (axeId: string) => {
  const { onSuccess, onError } = useAxeMutationHandlers(axeId)
  return useMutation({
    mutationFn: ({ id, nom, parent }: { id: string; nom: string; parent: string | null }) =>
      upsertModalite({ axeId, id, body: { nom: nom.trim(), parent } }),
    onSuccess,
    onError,
  })
}

export const useDeleteModalite = (axeId: string) => {
  const { toast, onSuccess, onError } = useAxeMutationHandlers(axeId)
  return useMutation({
    mutationFn: (id: string) => deleteModalite({ axeId, id }),
    onSuccess: async () => {
      await onSuccess()
      toast({ title: 'Modalité supprimée.' })
    },
    onError,
  })
}

// Les écritures du graphe d'un axe : renommer ou supprimer un niveau passe par l'axe entier.
export const useAxeEdition = (axe: AxeApiModel) => {
  const upsertAxeMutation = useUpsertAxe(axe.id)
  const upsertModaliteMutation = useUpsertModalite(axe.id)
  const deleteModaliteMutation = useDeleteModalite(axe.id)
  return {
    saveModalite: ({
      id,
      nom,
      parent,
      onSuccess,
    }: {
      id: string
      nom: string
      parent: string | null
      onSuccess?: () => void
    }) => upsertModaliteMutation.mutate({ id, nom, parent }, { onSuccess: () => onSuccess?.() }),
    deleteModalite: ({ id, onSuccess }: { id: string; onSuccess?: () => void }) =>
      deleteModaliteMutation.mutate(id, { onSuccess: () => onSuccess?.() }),
    saveNiveaux: ({ names, onSuccess }: { names: ReadonlyArray<string>; onSuccess?: () => void }) =>
      upsertAxeMutation.mutate(
        {
          nom: axe.nom,
          description: axe.description,
          niveaux: names.map((nom) => ({ nom: nom.trim() })),
        },
        { onSuccess: () => onSuccess?.() },
      ),
    isPending:
      upsertAxeMutation.isPending ||
      upsertModaliteMutation.isPending ||
      deleteModaliteMutation.isPending,
  }
}

export type AxeEdition = ReturnType<typeof useAxeEdition>
