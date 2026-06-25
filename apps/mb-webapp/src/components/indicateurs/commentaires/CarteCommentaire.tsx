import { type CommentaireApiModel } from '@pilote/mb-shared/commentaire'
import { type IndiceConfiance } from '@pilote/mb-shared/niveauConfiance'
import { MoreVertical, Pencil } from 'lucide-react'

import { BadgeStatut } from '@/components/indicateurs/commentaires/BadgeStatut'
import { ContenuRepliable } from '@/components/indicateurs/commentaires/ContenuRepliable'
import { libelleAuteur } from '@/components/indicateurs/commentaires/libelleAuteur'
import { MeteoTag } from '@/components/indicateurs/commentaires/MeteoTag'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Text } from '@/components/ui/Typography'
import { clsxm } from '@/lib/clsxm'
import { formatDateHeureFr } from '@/lib/format'

export function CarteCommentaire({
  commentaire,
  indice,
  onEdit,
}: {
  commentaire: CommentaireApiModel
  indice?: IndiceConfiance | undefined
  onEdit: () => void
}) {
  const brouillon = commentaire.statut === 'BROUILLON'
  return (
    <article
      className={clsxm(
        'rounded-r-sm border border-l-4 border-border bg-surface p-5 sm:p-6',
        brouillon ? 'border-l-warning' : 'border-l-primary',
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <BadgeStatut statut={commentaire.statut} />
        {/* TODO gating : conditionner l'affichage des actions (Éditer, …) aux
            autorisations réelles de l'utilisateur. Aujourd'hui on les montre à
            tous et l'API renvoie 403 si non-auteur (capté par un toast). */}
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
      </div>

      {indice && (
        <div className="mb-3">
          <MeteoTag indice={indice} />
        </div>
      )}

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
