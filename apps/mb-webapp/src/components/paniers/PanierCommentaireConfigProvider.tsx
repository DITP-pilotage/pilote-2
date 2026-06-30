import { type ReactNode, useMemo } from 'react'

import { type PanierCommentaireType } from '@/api/commentaires'
import {
  type CommentaireConfig,
  CommentaireConfigProvider,
} from '@/components/commentaires/CommentaireConfigContext'
import { useCreerCommentairePanier, useModifierCommentairePanier } from '@/mutations/commentaires'
import { useEnregistrerNiveauConfiancePanier } from '@/mutations/niveauConfiance'
import {
  brouillonPanierQueryOptions,
  commentairesPanierPubliesQueryOptions,
} from '@/queries/commentaires'
import { niveauPourCommentairePanierQueryOptions } from '@/queries/niveauConfiance'

export function PanierCommentaireConfigProvider({
  panierId,
  children,
}: {
  panierId: string
  children: ReactNode
}) {
  const config = useMemo<CommentaireConfig>(
    () => ({
      brouillonQueryOptions: (type) =>
        brouillonPanierQueryOptions(panierId, type as PanierCommentaireType),
      commentairesPubliesQueryOptions: (type) =>
        commentairesPanierPubliesQueryOptions(panierId, type as PanierCommentaireType),
      niveauPourCommentaireQueryOptions: (commentaireId) =>
        niveauPourCommentairePanierQueryOptions(panierId, commentaireId),
      useCreerCommentaire: (type) =>
        useCreerCommentairePanier(panierId, type as PanierCommentaireType),
      useModifierCommentaire: (type) =>
        useModifierCommentairePanier(panierId, type as PanierCommentaireType),
      useEnregistrerNiveauConfiance: () => useEnregistrerNiveauConfiancePanier(panierId),
    }),
    [panierId],
  )

  return <CommentaireConfigProvider value={config}>{children}</CommentaireConfigProvider>
}
