import { useSuspenseQuery } from '@tanstack/react-query'

import { type MeteoCourante } from '@/components/indicateurs/commentaires/EditeurCommentaire'
import { ListeCommentaires } from '@/components/indicateurs/commentaires/ListeCommentaires'
import { brouillonQueryOptions, commentairesPubliesQueryOptions } from '@/queries/commentaires'
import { niveauxParCommentairesQueryOptions } from '@/queries/niveauConfiance'

export function SectionMeteoSynthese({
  indicateurId,
  individuId,
}: {
  indicateurId: string
  individuId: string
}) {
  const { data: publies } = useSuspenseQuery(
    commentairesPubliesQueryOptions(indicateurId, individuId, 'CONFIANCE'),
  )
  const { data: brouillon } = useSuspenseQuery(
    brouillonQueryOptions(indicateurId, individuId, 'CONFIANCE'),
  )

  // Météos récupérées par lot, pour exactement les commentaires affichés.
  const commentaireIds = [...publies.map((c) => c.id), ...(brouillon ? [brouillon.id] : [])]
  const { data: niveaux } = useSuspenseQuery(
    niveauxParCommentairesQueryOptions(indicateurId, individuId, commentaireIds),
  )

  // niveaux antichronologiques → on garde le plus récent par commentaire.
  const meteoParCommentaire = new Map<string, MeteoCourante>()
  for (const niveau of niveaux.items) {
    if (!meteoParCommentaire.has(niveau.commentaire.id)) {
      meteoParCommentaire.set(niveau.commentaire.id, { niveauId: niveau.id, indice: niveau.indice })
    }
  }

  return (
    <ListeCommentaires
      indicateurId={indicateurId}
      individuId={individuId}
      type="CONFIANCE"
      avecMeteo
      brouillon={brouillon ?? undefined}
      publies={publies}
      meteoParCommentaire={meteoParCommentaire}
    />
  )
}
