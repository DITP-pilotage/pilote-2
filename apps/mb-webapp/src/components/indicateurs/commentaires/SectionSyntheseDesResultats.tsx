import { useSuspenseQuery } from '@tanstack/react-query'

import { type NiveauConfianceCourant } from '@/components/indicateurs/commentaires/EditeurCommentaire'
import { ListeCommentaires } from '@/components/indicateurs/commentaires/ListeCommentaires'
import { brouillonQueryOptions, commentairesPubliesQueryOptions } from '@/queries/commentaires'
import { niveauxParCommentairesQueryOptions } from '@/queries/niveauConfiance'

export function SectionSyntheseDesResultats({
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

  // Niveaux récupérés par lot, pour exactement les commentaires affichés.
  const commentaireIds = [...publies.map((c) => c.id), ...(brouillon ? [brouillon.id] : [])]
  const { data: niveaux } = useSuspenseQuery(
    niveauxParCommentairesQueryOptions(indicateurId, individuId, commentaireIds),
  )

  // niveaux antichronologiques → on garde le plus récent par commentaire.
  const niveauxParCommentaire = new Map<string, NiveauConfianceCourant>()
  for (const niveau of niveaux.items) {
    if (!niveauxParCommentaire.has(niveau.commentaire.id)) {
      niveauxParCommentaire.set(niveau.commentaire.id, {
        niveauId: niveau.id,
        indice: niveau.indice,
      })
    }
  }

  return (
    <ListeCommentaires
      indicateurId={indicateurId}
      individuId={individuId}
      type="CONFIANCE"
      avecNiveauConfiance
      brouillon={brouillon ?? undefined}
      publies={publies}
      niveauxParCommentaire={niveauxParCommentaire}
    />
  )
}
