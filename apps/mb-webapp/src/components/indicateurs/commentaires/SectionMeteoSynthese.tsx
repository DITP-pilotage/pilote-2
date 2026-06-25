import { useSuspenseQuery } from '@tanstack/react-query'

import { type MeteoCourante } from '@/components/indicateurs/commentaires/EditeurCommentaire'
import { ListeCommentaires } from '@/components/indicateurs/commentaires/ListeCommentaires'
import { commentairesQueryOptions } from '@/queries/commentaires'
import { niveauConfianceHistoriqueQueryOptions } from '@/queries/niveauConfiance'

export function SectionMeteoSynthese({
  indicateurId,
  individuId,
}: {
  indicateurId: string
  individuId: string
}) {
  const { data: publies } = useSuspenseQuery(
    commentairesQueryOptions(indicateurId, individuId, 'CONFIANCE', 'PUBLIE'),
  )
  const { data: brouillons } = useSuspenseQuery(
    commentairesQueryOptions(indicateurId, individuId, 'CONFIANCE', 'BROUILLON'),
  )
  const { data: niveaux } = useSuspenseQuery(
    niveauConfianceHistoriqueQueryOptions(indicateurId, individuId),
  )

  // niveaux triés antichronologiquement → on garde le plus récent par commentaire.
  const meteoParCommentaire = new Map<string, MeteoCourante>()
  for (const niveau of niveaux) {
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
      brouillon={brouillons[0]}
      publies={publies}
      meteoParCommentaire={meteoParCommentaire}
    />
  )
}
