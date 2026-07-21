import { type CommentaireApiModel } from '@pilote/kpilote-shared/commentaire'
import { useSuspenseQuery } from '@tanstack/react-query'

import { useCommentaireConfig } from '@/components/commentaires/CommentaireConfigContext'
import { ContenuRepliable } from '@/components/commentaires/ContenuRepliable'
import { libelleAuteur } from '@/components/commentaires/libelleAuteur'
import {
  iconeMeteoIndice,
  niveauConfianceFromIndice,
} from '@/components/commentaires/niveauConfianceAffichage'
import { Text } from '@pilote/kpilote-ui/Typography'
import { formatDateHeureFr } from '@/lib/format'

export function LigneHistorique({
  commentaire,
  avecNiveauConfiance,
}: {
  commentaire: CommentaireApiModel
  avecNiveauConfiance: boolean
}) {
  return (
    <div className="py-4">
      <div className="mb-2 flex items-center gap-3">
        {avecNiveauConfiance && <NiveauConfianceInline commentaireId={commentaire.id} />}
        <Text as="span" variant="caption" tone="muted" className="ml-auto">
          {formatDateHeureFr(commentaire.updatedAt)} ·{' '}
          {libelleAuteur(commentaire.auteurModification)}
        </Text>
      </div>
      <ContenuRepliable html={commentaire.contenu} />
    </div>
  )
}

function NiveauConfianceInline({ commentaireId }: { commentaireId: string }) {
  const { niveauPourCommentaireQueryOptions } = useCommentaireConfig()
  const { data: niveau } = useSuspenseQuery(niveauPourCommentaireQueryOptions(commentaireId))
  if (!niveau) return null
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-normal leading-none text-text">
      <img
        src={iconeMeteoIndice(niveau.indice)}
        alt=""
        aria-hidden
        className="h-5 w-auto shrink-0"
      />
      {niveauConfianceFromIndice(niveau.indice).label}
    </span>
  )
}
