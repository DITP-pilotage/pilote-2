import {
  type CreerNiveauConfianceBody,
  type ModifierNiveauConfianceBody,
} from '@pilote/kpilote-shared/niveauConfiance'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createNiveauConfiance, updateNiveauConfiance } from '@/api/niveauConfiance'
import { useToast } from '@/components/ui/Toast'
import { niveauConfianceKeys, niveauConfiancePanierKeys } from '@/queries/niveauConfiance'

function useEnregistrerNiveauConfianceInterne(invalider: () => Promise<void>) {
  const toast = useToast()
  // Pas de toast de succès : le niveau de confiance est persisté au moment de
  // l'enregistrement du commentaire, qui porte déjà le toast de succès.
  const creer = useMutation({
    mutationFn: (body: CreerNiveauConfianceBody) => createNiveauConfiance(body),
    onSuccess: () => void invalider(),
    onError: () => toast({ title: 'Niveau de confiance non enregistré.', variant: 'error' }),
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
    onError: () => toast({ title: 'Niveau de confiance non mis à jour.', variant: 'error' }),
  })

  return { creer, modifier }
}

export function useEnregistrerNiveauConfiance(indicateurId: string, individuId: string) {
  const queryClient = useQueryClient()
  return useEnregistrerNiveauConfianceInterne(async () => {
    await queryClient.invalidateQueries({
      queryKey: niveauConfianceKeys.parScope(indicateurId, individuId),
    })
  })
}

export function useEnregistrerNiveauConfiancePanier(panierId: string) {
  const queryClient = useQueryClient()
  return useEnregistrerNiveauConfianceInterne(async () => {
    await queryClient.invalidateQueries({
      queryKey: niveauConfiancePanierKeys.parScope(panierId),
    })
  })
}
