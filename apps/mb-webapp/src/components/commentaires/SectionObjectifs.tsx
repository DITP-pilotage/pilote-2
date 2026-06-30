import { useSuspenseQuery } from '@tanstack/react-query'

import { useCommentaireConfig } from '@/components/commentaires/CommentaireConfigContext'
import { ListeCommentaires } from '@/components/commentaires/ListeCommentaires'

export function SectionObjectifs() {
  const { commentairesPubliesQueryOptions, brouillonQueryOptions } = useCommentaireConfig()
  const { data: publies } = useSuspenseQuery(commentairesPubliesQueryOptions('OBJECTIF'))
  const { data: brouillon } = useSuspenseQuery(brouillonQueryOptions('OBJECTIF'))

  return (
    <ListeCommentaires
      type="OBJECTIF"
      avecNiveauConfiance={false}
      brouillon={brouillon ?? undefined}
      publies={publies}
    />
  )
}
