import { type CommentaireApiModel } from '@pilote/mb-shared/commentaire'
import { useSuspenseQuery } from '@tanstack/react-query'
import { MoreVertical, Pencil } from 'lucide-react'

import { useCommentaireConfig } from '@/components/commentaires/CommentaireConfigContext'
import { BadgeStatut } from '@/components/commentaires/BadgeStatut'
import { ContenuRepliable } from '@/components/commentaires/ContenuRepliable'
import { libelleAuteur } from '@/components/commentaires/libelleAuteur'
import { MeteoTag } from '@/components/commentaires/MeteoTag'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Text } from '@/components/ui/Typography'
import { auth } from '@/auth'
import { clsxm } from '@/lib/clsxm'
import { formatDateHeureFr } from '@/lib/format'

export function CarteCommentaire({
  commentaire,
  avecNiveauConfiance,
  onEdit,
}: {
  commentaire: CommentaireApiModel
  avecNiveauConfiance: boolean
  onEdit: () => void
}) {
  const canWrite = useCommentaireConfig().useCanWrite()
  const brouillon = commentaire.statut === 'BROUILLON'
  // L'édition est réservée à l'auteur (createdBy) ET requiert le droit d'écriture sur la
  // ressource. `me.userId` et `auteurCreation.id` sont le même identifiant de principal
  // (cf. backend), donc comparaison directe.
  const peutModifier = canWrite && commentaire.auteurCreation.id === auth.user?.userId
  return (
    <article
      className={clsxm(
        'rounded-r-sm border border-l-4 border-border bg-surface p-5 sm:p-6',
        brouillon ? 'border-l-warning' : 'border-l-primary',
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <BadgeStatut statut={commentaire.statut} />
        {peutModifier && (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Actions"
              className="ml-auto flex size-8 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:bg-surface-tinted hover:text-primary"
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil />
                Éditer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {avecNiveauConfiance && <MeteoBadge commentaireId={commentaire.id} />}

      <ContenuRepliable html={commentaire.contenu} />

      <div className="mt-4 border-t border-border pt-3">
        <Text variant="caption" tone="muted">
          Modifié le {formatDateHeureFr(commentaire.updatedAt)} par{' '}
          {libelleAuteur(commentaire.auteurModification)}
        </Text>
      </div>
    </article>
  )
}

function MeteoBadge({ commentaireId }: { commentaireId: string }) {
  const { niveauPourCommentaireQueryOptions } = useCommentaireConfig()
  const { data: niveau } = useSuspenseQuery(niveauPourCommentaireQueryOptions(commentaireId))
  if (!niveau) return null
  return (
    <div className="mb-3">
      <MeteoTag indice={niveau.indice} />
    </div>
  )
}
