import { useSuspenseQuery } from '@tanstack/react-query'

import { type MeteoCourante } from '@/components/indicateurs/commentaires/EditeurCommentaire'
import { ListeCommentaires } from '@/components/indicateurs/commentaires/ListeCommentaires'
import { commentairesQueryOptions } from '@/queries/commentaires'

const SANS_METEO = new Map<string, MeteoCourante>()

export function SectionAutresCommentaires({
  indicateurId,
  individuId,
}: {
  indicateurId: string
  individuId: string
}) {
  const { data: commentaires } = useSuspenseQuery(
    commentairesQueryOptions(indicateurId, individuId, 'DEFAUT'),
  )

  return (
    <ListeCommentaires
      indicateurId={indicateurId}
      individuId={individuId}
      type="DEFAUT"
      avecMeteo={false}
      commentaires={commentaires}
      meteoParCommentaire={SANS_METEO}
    />
  )
}
