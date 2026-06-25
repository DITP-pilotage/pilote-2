import {
  type CreerNiveauConfianceBody,
  type ModifierNiveauConfianceBody,
} from '@pilote/mb-shared/niveauConfiance'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createNiveauConfiance, updateNiveauConfiance } from '@/api/niveauConfiance'
import { useToast } from '@/components/ui/Toast'
import { niveauConfianceKeys } from '@/queries/niveauConfiance'

export function useEnregistrerMeteo(indicateurId: string, individuId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()

  const invalider = () =>
    queryClient.invalidateQueries({
      queryKey: niveauConfianceKeys.historique(indicateurId, individuId),
    })

  // Pas de toast de succès : la météo est persistée au moment de l'enregistrement
  // du commentaire, qui porte déjà le toast de succès.
  const creer = useMutation({
    mutationFn: (body: CreerNiveauConfianceBody) => createNiveauConfiance(body),
    onSuccess: () => void invalider(),
    onError: () => toast({ title: 'Météo non enregistrée.', variant: 'error' }),
  })

  const modifier = useMutation({
    mutationFn: ({
      niveauConfianceId,
      body,
    }: {
      niveauConfianceId: string
      body: ModifierNiveauConfianceBody
    }) => updateNiveauConfiance(niveauConfianceId, body),
    onSuccess: () => void invalider(),
    onError: () => toast({ title: 'Météo non mise à jour.', variant: 'error' }),
  })

  return { creer, modifier }
}
