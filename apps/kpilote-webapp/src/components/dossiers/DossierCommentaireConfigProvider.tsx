import { type ReactNode, useMemo } from 'react'

import { type DossierCommentaireType } from '@/api/commentaires'
import {
  type CommentaireConfig,
  CommentaireConfigProvider,
} from '@/components/commentaires/CommentaireConfigContext'
import { useCreerCommentaireDossier, useModifierCommentaireDossier } from '@/mutations/commentaires'
import { useEnregistrerNiveauConfianceDossier } from '@/mutations/niveauConfiance'
import {
  brouillonDossierQueryOptions,
  commentairesDossierPubliesQueryOptions,
} from '@/queries/commentaires'
import { useCanWriteDossier } from '@/queries/mePermissions'
import { niveauPourCommentaireDossierQueryOptions } from '@/queries/niveauConfiance'

export function DossierCommentaireConfigProvider({
  dossierId,
  children,
}: {
  dossierId: string
  children: ReactNode
}) {
  const config = useMemo<CommentaireConfig>(
    () => ({
      brouillonQueryOptions: (type) =>
        brouillonDossierQueryOptions(dossierId, type as DossierCommentaireType),
      commentairesPubliesQueryOptions: (type) =>
        commentairesDossierPubliesQueryOptions(dossierId, type as DossierCommentaireType),
      niveauPourCommentaireQueryOptions: (commentaireId) =>
        niveauPourCommentaireDossierQueryOptions(dossierId, commentaireId),
      useCreerCommentaire: (type) =>
        useCreerCommentaireDossier(dossierId, type as DossierCommentaireType),
      useModifierCommentaire: (type) =>
        useModifierCommentaireDossier(dossierId, type as DossierCommentaireType),
      useEnregistrerNiveauConfiance: () => useEnregistrerNiveauConfianceDossier(dossierId),
      useCanWrite: () => useCanWriteDossier(dossierId),
    }),
    [dossierId],
  )

  return <CommentaireConfigProvider value={config}>{children}</CommentaireConfigProvider>
}
