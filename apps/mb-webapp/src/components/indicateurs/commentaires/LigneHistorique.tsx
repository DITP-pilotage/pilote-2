import { type CommentaireApiModel } from '@pilote/mb-shared/commentaire'
import { type IndiceConfiance } from '@pilote/mb-shared/niveauConfiance'

import { ContenuRepliable } from '@/components/indicateurs/commentaires/ContenuRepliable'
import { libelleAuteur } from '@/components/indicateurs/commentaires/libelleAuteur'
import { meteoFromIndice } from '@/components/indicateurs/commentaires/meteo'
import { Text } from '@/components/ui/Typography'
import { formatDateHeureFr } from '@/lib/format'

export function LigneHistorique({
  commentaire,
  indice,
}: {
  commentaire: CommentaireApiModel
  indice?: IndiceConfiance | undefined
}) {
  const meteo = indice ? meteoFromIndice(indice) : undefined
  return (
    <div className="py-4">
      <div className="mb-2 flex items-center gap-3">
        {meteo && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
            <meteo.Icon className="size-4" />
            {meteo.label}
          </span>
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
