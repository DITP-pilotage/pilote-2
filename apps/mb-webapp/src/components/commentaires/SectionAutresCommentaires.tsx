import { useSuspenseQuery } from '@tanstack/react-query'

import { useCommentaireConfig } from '@/components/commentaires/CommentaireConfigContext'
import { ListeCommentaires } from '@/components/commentaires/ListeCommentaires'

export function SectionAutresCommentaires() {
  const { commentairesPubliesQueryOptions, brouillonQueryOptions } = useCommentaireConfig()
  const { data: publies } = useSuspenseQuery(commentairesPubliesQueryOptions('DEFAUT'))
  const { data: brouillon } = useSuspenseQuery(brouillonQueryOptions('DEFAUT'))

  return (
    <ListeCommentaires
      type="DEFAUT"
      avecNiveauConfiance={false}
      brouillon={brouillon ?? undefined}
      publies={publies}
    />
  )
}
