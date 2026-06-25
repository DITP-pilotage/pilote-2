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
  const { data: publies } = useSuspenseQuery(
    commentairesQueryOptions(indicateurId, individuId, 'DEFAUT', 'PUBLIE'),
  )
  const { data: brouillons } = useSuspenseQuery(
    commentairesQueryOptions(indicateurId, individuId, 'DEFAUT', 'BROUILLON'),
  )

  return (
    <ListeCommentaires
      indicateurId={indicateurId}
      individuId={individuId}
      type="DEFAUT"
      avecMeteo={false}
      brouillon={brouillons[0]}
      publies={publies}
      meteoParCommentaire={SANS_METEO}
    />
  )
}
