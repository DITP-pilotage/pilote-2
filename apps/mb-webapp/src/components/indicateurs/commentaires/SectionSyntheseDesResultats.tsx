import { useSuspenseQueries } from '@tanstack/react-query'

import { ListeCommentaires } from '@/components/indicateurs/commentaires/ListeCommentaires'
import { brouillonQueryOptions, commentairesPubliesQueryOptions } from '@/queries/commentaires'

export function SectionSyntheseDesResultats({
  indicateurId,
  individuId,
}: {
  indicateurId: string
  individuId: string
}) {
  const [{ data: publies }, { data: brouillon }] = useSuspenseQueries({
    queries: [
      commentairesPubliesQueryOptions(indicateurId, individuId, 'CONFIANCE'),
      brouillonQueryOptions(indicateurId, individuId, 'CONFIANCE'),
    ],
  })

  return (
    <ListeCommentaires
      indicateurId={indicateurId}
      individuId={individuId}
      type="CONFIANCE"
      avecNiveauConfiance
      brouillon={brouillon ?? undefined}
      publies={publies}
    />
  )
}
