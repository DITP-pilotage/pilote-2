import { useSuspenseQuery } from '@tanstack/react-query'

import { useCommentaireConfig } from '@/components/commentaires/CommentaireConfigContext'
import { ListeCommentaires } from '@/components/commentaires/ListeCommentaires'

export function SectionSyntheseDesResultats() {
  const { commentairesPubliesQueryOptions, brouillonQueryOptions } = useCommentaireConfig()
  // Deux useSuspenseQuery distincts : Suspense les regroupe dans la même phase de fetch.
  const { data: publies } = useSuspenseQuery(commentairesPubliesQueryOptions('CONFIANCE'))
  const { data: brouillon } = useSuspenseQuery(brouillonQueryOptions('CONFIANCE'))

  return (
    <ListeCommentaires
      type="CONFIANCE"
      avecNiveauConfiance
      brouillon={brouillon ?? undefined}
      publies={publies}
    />
  )
}
