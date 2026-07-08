import {
  type CreerCommentaireBody,
  type ModifierCommentaireBody,
} from '@pilote/kpilote-shared/commentaire'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  createCommentaire,
  createCommentaireDossier,
  type IndicateurIndividuCommentaireType,
  type DossierCommentaireType,
  updateCommentaire,
} from '@/api/commentaires'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { commentairesKeys, commentairesDossierKeys } from '@/queries/commentaires'
import { niveauConfianceKeys, niveauConfianceDossierKeys } from '@/queries/niveauConfiance'

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

// --- Dossier global -----------------------------------------------------------

export function useCreerCommentaireDossier(dossierId: string, type: DossierCommentaireType) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (body: CreerCommentaireBody) => createCommentaireDossier(dossierId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: commentairesDossierKeys.parType(dossierId, type),
      })
      toast({ title: 'Commentaire créé.' })
    },
    onError: () => toast(messageErreur),
  })
}

export function useModifierCommentaireDossier(dossierId: string, type: DossierCommentaireType) {
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
        queryKey: commentairesDossierKeys.parType(dossierId, type),
      })
      void queryClient.invalidateQueries({
        queryKey: niveauConfianceDossierKeys.parScope(dossierId),
      })
      toast({
        title:
          variables.body.statut === 'PUBLIE' ? 'Commentaire publié.' : 'Commentaire enregistré.',
      })
    },
    onError: () => toast(messageErreur),
  })
}
