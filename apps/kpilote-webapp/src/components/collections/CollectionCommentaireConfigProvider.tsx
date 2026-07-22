import { type ReactNode, useMemo } from 'react'

import { type CollectionCommentaireType } from '@/api/commentaires'
import {
  type CommentaireConfig,
  CommentaireConfigProvider,
} from '@/components/commentaires/CommentaireConfigContext'
import {
  useCreerCommentaireCollection,
  useModifierCommentaireCollection,
} from '@/mutations/commentaires'
import { useEnregistrerNiveauConfianceCollection } from '@/mutations/niveauConfiance'
import {
  brouillonCollectionQueryOptions,
  commentairesCollectionPubliesQueryOptions,
} from '@/queries/commentaires'
import { useCanWriteCollection } from '@/queries/mePermissions'
import { niveauPourCommentaireCollectionQueryOptions } from '@/queries/niveauConfiance'

export function CollectionCommentaireConfigProvider({
  collectionId,
  children,
}: {
  collectionId: string
  children: ReactNode
}) {
  const config = useMemo<CommentaireConfig>(
    () => ({
      brouillonQueryOptions: (type) =>
        brouillonCollectionQueryOptions(collectionId, type as CollectionCommentaireType),
      commentairesPubliesQueryOptions: (type) =>
        commentairesCollectionPubliesQueryOptions(collectionId, type as CollectionCommentaireType),
      niveauPourCommentaireQueryOptions: (commentaireId) =>
        niveauPourCommentaireCollectionQueryOptions(collectionId, commentaireId),
      useCreerCommentaire: (type) =>
        useCreerCommentaireCollection(collectionId, type as CollectionCommentaireType),
      useModifierCommentaire: (type) =>
        useModifierCommentaireCollection(collectionId, type as CollectionCommentaireType),
      useEnregistrerNiveauConfiance: () => useEnregistrerNiveauConfianceCollection(collectionId),
      useCanWrite: () => useCanWriteCollection(collectionId),
    }),
    [collectionId],
  )

  return <CommentaireConfigProvider value={config}>{children}</CommentaireConfigProvider>
}
