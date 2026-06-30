import { type ReactNode, useMemo } from 'react'

import { type IndicateurIndividuCommentaireType } from '@/api/commentaires'
import {
  type CommentaireConfig,
  CommentaireConfigProvider,
} from '@/components/commentaires/CommentaireConfigContext'
import { useCreerCommentaire, useModifierCommentaire } from '@/mutations/commentaires'
import { useEnregistrerNiveauConfiance } from '@/mutations/niveauConfiance'
import { brouillonQueryOptions, commentairesPubliesQueryOptions } from '@/queries/commentaires'
import { niveauPourCommentaireQueryOptions } from '@/queries/niveauConfiance'

export function IndicateurCommentaireConfigProvider({
  indicateurId,
  individuId,
  children,
}: {
  indicateurId: string
  individuId: string
  children: ReactNode
}) {
  const config = useMemo<CommentaireConfig>(
    () => ({
      brouillonQueryOptions: (type) =>
        brouillonQueryOptions(indicateurId, individuId, type as IndicateurIndividuCommentaireType),
      commentairesPubliesQueryOptions: (type) =>
        commentairesPubliesQueryOptions(
          indicateurId,
          individuId,
          type as IndicateurIndividuCommentaireType,
        ),
      niveauPourCommentaireQueryOptions: (commentaireId) =>
        niveauPourCommentaireQueryOptions(indicateurId, individuId, commentaireId),
      useCreerCommentaire: (type) =>
        useCreerCommentaire(indicateurId, individuId, type as IndicateurIndividuCommentaireType),
      useModifierCommentaire: (type) =>
        useModifierCommentaire(indicateurId, individuId, type as IndicateurIndividuCommentaireType),
      useEnregistrerNiveauConfiance: () =>
        useEnregistrerNiveauConfiance(indicateurId, individuId),
    }),
    [indicateurId, individuId],
  )

  return <CommentaireConfigProvider value={config}>{children}</CommentaireConfigProvider>
}
