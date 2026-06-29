import { type CommentaireApiModel } from '@pilote/mb-shared/commentaire'
import { useSuspenseQuery } from '@tanstack/react-query'

import { ContenuRepliable } from '@/components/indicateurs/commentaires/ContenuRepliable'
import { libelleAuteur } from '@/components/indicateurs/commentaires/libelleAuteur'
import { meteoFromIndice } from '@/components/indicateurs/commentaires/meteo'
import { Text } from '@/components/ui/Typography'
import { formatDateHeureFr } from '@/lib/format'
import { niveauPourCommentaireQueryOptions } from '@/queries/niveauConfiance'

export function LigneHistorique({
  indicateurId,
  individuId,
  commentaire,
  avecNiveauConfiance,
}: {
  indicateurId: string
  individuId: string
  commentaire: CommentaireApiModel
  avecNiveauConfiance: boolean
}) {
  return (
    <div className="py-4">
      <div className="mb-2 flex items-center gap-3">
        {avecNiveauConfiance && (
          <MeteoInline
            indicateurId={indicateurId}
            individuId={individuId}
            commentaireId={commentaire.id}
          />
        )}
        <Text as="span" variant="caption" tone="muted" className="ml-auto">
          {formatDateHeureFr(commentaire.updatedAt)} ·{' '}
          {libelleAuteur(commentaire.auteurModification)}
        </Text>
      </div>
      <ContenuRepliable html={commentaire.contenu} />
    </div>
  )
}

function MeteoInline({
  indicateurId,
  individuId,
  commentaireId,
}: {
  indicateurId: string
  individuId: string
  commentaireId: string
}) {
  const { data: niveau } = useSuspenseQuery(
    niveauPourCommentaireQueryOptions(indicateurId, individuId, commentaireId),
  )
  if (!niveau) return null
  const { label, Icon } = meteoFromIndice(niveau.indice)
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium leading-none text-primary">
      <Icon className="size-4 shrink-0" />
      {label}
    </span>
  )
}
