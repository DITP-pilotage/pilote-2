import { useSuspenseQuery } from '@tanstack/react-query'

import { type NiveauConfianceCourant } from '@/components/indicateurs/commentaires/EditeurCommentaire'
import { ListeCommentaires } from '@/components/indicateurs/commentaires/ListeCommentaires'
import { brouillonQueryOptions, commentairesPubliesQueryOptions } from '@/queries/commentaires'

const SANS_NIVEAUX = new Map<string, NiveauConfianceCourant>()

export function SectionAutresCommentaires({
  indicateurId,
  individuId,
}: {
  indicateurId: string
  individuId: string
}) {
  const { data: publies } = useSuspenseQuery(
    commentairesPubliesQueryOptions(indicateurId, individuId, 'DEFAUT'),
  )
  const { data: brouillon } = useSuspenseQuery(
    brouillonQueryOptions(indicateurId, individuId, 'DEFAUT'),
  )

  return (
    <ListeCommentaires
      indicateurId={indicateurId}
      individuId={individuId}
      type="DEFAUT"
      avecNiveauConfiance={false}
      brouillon={brouillon ?? undefined}
      publies={publies}
      niveauxParCommentaire={SANS_NIVEAUX}
    />
  )
}
