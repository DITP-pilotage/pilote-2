import {
  type CreerCommentaireBody,
  type ModifierCommentaireBody,
} from '@pilote/kpilote-shared/commentaire'
import { analyticsEvents } from '@pilote/kpilote-shared/analytics/events'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  createCommentaire,
  createCommentaireCollection,
  type IndicateurIndividuCommentaireType,
  type CollectionCommentaireType,
  updateCommentaire,
} from '@/api/commentaires'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { commentairesKeys, commentairesCollectionKeys } from '@/queries/commentaires'
import { niveauConfianceKeys, niveauConfianceCollectionKeys } from '@/queries/niveauConfiance'

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
    meta: {
      analyticsSuccess: analyticsEvents.commentaire.publish({
        entity_type: 'indicateur',
        commentaire_type: type,
      }),
    },
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
    meta: {
      analyticsSuccess: analyticsEvents.commentaire.publish({
        entity_type: 'indicateur',
        commentaire_type: type,
      }),
    },
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

// --- Collection global -----------------------------------------------------------

export function useCreerCommentaireCollection(
  collectionId: string,
  type: CollectionCommentaireType,
) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    meta: {
      analyticsSuccess: analyticsEvents.commentaire.publish({
        entity_type: 'collection',
        commentaire_type: type,
      }),
    },
    mutationFn: (body: CreerCommentaireBody) => createCommentaireCollection(collectionId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: commentairesCollectionKeys.parType(collectionId, type),
      })
      toast({ title: 'Commentaire créé.' })
    },
    onError: () => toast(messageErreur),
  })
}

export function useModifierCommentaireCollection(
  collectionId: string,
  type: CollectionCommentaireType,
) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    meta: {
      analyticsSuccess: analyticsEvents.commentaire.publish({
        entity_type: 'collection',
        commentaire_type: type,
      }),
    },
    mutationFn: ({
      commentaireId,
      body,
    }: {
      commentaireId: string
      body: ModifierCommentaireBody
    }) => updateCommentaire(commentaireId, body),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: commentairesCollectionKeys.parType(collectionId, type),
      })
      void queryClient.invalidateQueries({
        queryKey: niveauConfianceCollectionKeys.parScope(collectionId),
      })
      toast({
        title:
          variables.body.statut === 'PUBLIE' ? 'Commentaire publié.' : 'Commentaire enregistré.',
      })
    },
    onError: () => toast(messageErreur),
  })
}
