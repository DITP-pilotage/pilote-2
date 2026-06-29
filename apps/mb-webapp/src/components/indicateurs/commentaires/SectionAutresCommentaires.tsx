import { useSuspenseQueries } from '@tanstack/react-query'

import { ListeCommentaires } from '@/components/indicateurs/commentaires/ListeCommentaires'
import { brouillonQueryOptions, commentairesPubliesQueryOptions } from '@/queries/commentaires'

export function SectionAutresCommentaires({
  indicateurId,
  individuId,
}: {
  indicateurId: string
  individuId: string
}) {
  const [{ data: publies }, { data: brouillon }] = useSuspenseQueries({
    queries: [
      commentairesPubliesQueryOptions(indicateurId, individuId, 'DEFAUT'),
      brouillonQueryOptions(indicateurId, individuId, 'DEFAUT'),
    ],
  })

  return (
    <ListeCommentaires
      indicateurId={indicateurId}
      individuId={individuId}
      type="DEFAUT"
      avecNiveauConfiance={false}
      brouillon={brouillon ?? undefined}
      publies={publies}
    />
  )
}
