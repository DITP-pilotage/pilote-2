import { type CommentaireApiModel } from '@pilote/kpilot-shared/commentaire'
import { useSuspenseQuery } from '@tanstack/react-query'

import { useCommentaireConfig } from '@/components/commentaires/CommentaireConfigContext'
import { ContenuRepliable } from '@/components/commentaires/ContenuRepliable'
import { libelleAuteur } from '@/components/commentaires/libelleAuteur'
import {
  couleurIndice,
  niveauConfianceFromIndice,
} from '@/components/commentaires/niveauConfianceAffichage'
import { Text } from '@/components/ui/Typography'
import { clsxm } from '@/lib/clsxm'
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
  const { label } = niveauConfianceFromIndice(niveau.indice)
  return (
    <span
      className={clsxm(
        'inline-flex items-center text-sm font-semibold leading-none',
        couleurIndice(niveau.indice).texte,
      )}
    >
      {label}
    </span>
  )
}
