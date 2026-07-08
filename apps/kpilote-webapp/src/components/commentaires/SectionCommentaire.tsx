import { useSuspenseQuery } from '@tanstack/react-query'

import { typeAvecNiveauConfiance } from '@/api/commentaires'
import { useCommentaireConfig } from '@/components/commentaires/CommentaireConfigContext'
import { ListeCommentaires } from '@/components/commentaires/ListeCommentaires'

// Section générique paramétrée par le type de commentaire. Le type est opaque ici
// (string) : chaque écran monte le Provider qui connaît l'enum exact.
// Deux useSuspenseQuery distincts : Suspense les regroupe dans la même phase de fetch.
export function SectionCommentaire({ type }: { type: string }) {
  const { commentairesPubliesQueryOptions, brouillonQueryOptions } = useCommentaireConfig()
  const { data: publies } = useSuspenseQuery(commentairesPubliesQueryOptions(type))
  const { data: brouillon } = useSuspenseQuery(brouillonQueryOptions(type))

  return (
    <ListeCommentaires
      type={type}
      avecNiveauConfiance={typeAvecNiveauConfiance(type)}
      brouillon={brouillon ?? undefined}
      publies={publies}
    />
  )
}
