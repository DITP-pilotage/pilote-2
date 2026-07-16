import {
  type CreerCommentaireBody,
  type ModifierCommentaireBody,
} from '@pilote/kpilote-shared/commentaire'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  createCommentaire,
  createCommentairePanier,
  type IndicateurIndividuCommentaireType,
  type PanierCommentaireType,
  updateCommentaire,
} from '@/api/commentaires'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { commentairesKeys, commentairesPanierKeys } from '@/queries/commentaires'
import { niveauConfianceKeys, niveauConfiancePanierKeys } from '@/queries/niveauConfiance'

const messageErreur = {
  title: 'Action impossible.',
  description: "Une erreur est survenue (vous n'êtes peut-être pas l'auteur de ce commentaire).",
  variant: 'error',
} as const

export function useCreerCommentaire(
  indicateurId: string,
  individuId: string,
  type: IndicateurIndividuCommentaireType,
) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (body: CreerCommentaireBody) => createCommentaire(indicateurId, individuId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: commentairesKeys.parType(indicateurId, individuId, type),
      })
      toast({ title: 'Commentaire créé.' })
    },
    onError: () => toast(messageErreur),
  })
}

export function useModifierCommentaire(
  indicateurId: string,
  individuId: string,
  type: IndicateurIndividuCommentaireType,
) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({
      commentaireId,
      body,
    }: {
      commentaireId: string
      body: ModifierCommentaireBody
    }) => updateCommentaire(commentaireId, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: commentairesKeys.parType(indicateurId, individuId, type),
      })
      void queryClient.invalidateQueries({
        queryKey: niveauConfianceKeys.parScope(indicateurId, individuId),
      })
      toast({
        title:
          variables.body.statut === 'PUBLIE' ? 'Commentaire publié.' : 'Commentaire enregistré.',
      })
    },
    onError: () => toast(messageErreur),
  })
}

// --- Panier global -----------------------------------------------------------

export function useCreerCommentairePanier(panierId: string, type: PanierCommentaireType) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (body: CreerCommentaireBody) => createCommentairePanier(panierId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: commentairesPanierKeys.parType(panierId, type),
      })
      toast({ title: 'Commentaire créé.' })
    },
    onError: () => toast(messageErreur),
  })
}

export function useModifierCommentairePanier(panierId: string, type: PanierCommentaireType) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({
      commentaireId,
      body,
    }: {
      commentaireId: string
      body: ModifierCommentaireBody
    }) => updateCommentaire(commentaireId, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: commentairesPanierKeys.parType(panierId, type),
      })
      void queryClient.invalidateQueries({
        queryKey: niveauConfiancePanierKeys.parScope(panierId),
      })
      toast({
        title:
          variables.body.statut === 'PUBLIE' ? 'Commentaire publié.' : 'Commentaire enregistré.',
      })
    },
    onError: () => toast(messageErreur),
  })
}
