import { type CommentaireApiModel } from '@pilote/mb-shared/commentaire'
import { type IndiceConfiance } from '@pilote/mb-shared/niveauConfiance'
import { Send } from 'lucide-react'
import { useState } from 'react'

import { type IndicateurIndividuCommentaireType } from '@/api/commentaires'
import { EditeurRiche } from '@/components/editeur-riche/EditeurRiche'
import { BadgeStatut } from '@/components/indicateurs/commentaires/BadgeStatut'
import { libelleAuteur } from '@/components/indicateurs/commentaires/libelleAuteur'
import { SelecteurMeteo } from '@/components/indicateurs/commentaires/SelecteurMeteo'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Typography'
import { clsxm } from '@/lib/clsxm'
import { formatDateTimeFr } from '@/lib/format'
import { useModifierCommentaire } from '@/mutations/commentaires'
import { useEnregistrerMeteo } from '@/mutations/niveauConfiance'

export type MeteoCourante = { niveauId: string; indice: IndiceConfiance }

export function EditeurCommentaire({
  indicateurId,
  individuId,
  type,
  commentaire,
  avecMeteo,
  meteo,
  onClose,
}: {
  indicateurId: string
  individuId: string
  type: IndicateurIndividuCommentaireType
  commentaire: CommentaireApiModel
  avecMeteo: boolean
  meteo?: MeteoCourante | undefined
  onClose?: (() => void) | undefined
}) {
  const [contenu, setContenu] = useState(commentaire.contenu)
  const modifier = useModifierCommentaire(indicateurId, individuId, type)
  const { creer: creerMeteo, modifier: modifierMeteo } = useEnregistrerMeteo(
    indicateurId,
    individuId,
  )

  const brouillon = commentaire.statut === 'BROUILLON'

  const onMeteoChange = (indice: IndiceConfiance) => {
    if (meteo) {
      modifierMeteo.mutate({ niveauConfianceId: meteo.niveauId, body: { indice } })
    } else {
      creerMeteo.mutate({ commentaireId: commentaire.id, indice })
    }
  }

  const enregistrer = () =>
    modifier.mutate(
      { commentaireId: commentaire.id, body: { contenu } },
      { onSuccess: () => onClose?.() },
    )

  const publier = () =>
    modifier.mutate(
      { commentaireId: commentaire.id, body: { contenu, statut: 'PUBLIE' } },
      { onSuccess: () => onClose?.() },
    )

  return (
    <article
      className={clsxm(
        'rounded-r-sm border border-l-4 border-border bg-surface p-5 sm:p-6',
        brouillon ? 'border-l-warning' : 'border-l-primary',
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <BadgeStatut statut={commentaire.statut} />
      </div>

      {avecMeteo && (
        <div className="mb-5">
          <Text variant="caption" weight="semibold" tone="muted" className="mb-2 block">
            Météo
          </Text>
          <SelecteurMeteo
            value={meteo?.indice}
            onChange={onMeteoChange}
            disabled={creerMeteo.isPending || modifierMeteo.isPending}
          />
        </div>
      )}

      <Text variant="caption" weight="semibold" tone="muted" className="mb-2 block">
        Commentaire
      </Text>
      <EditeurRiche contenu={commentaire.contenu} onChange={setContenu} />

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <Text variant="caption" tone="muted">
          Modifié le {formatDateTimeFr(commentaire.updatedAt)} par{' '}
          {libelleAuteur(commentaire.auteurModification)}
        </Text>
        <div className="ml-auto flex gap-3">
          {brouillon ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={enregistrer}
                disabled={modifier.isPending}
              >
                Enregistrer
              </Button>
              <Button size="sm" type="button" onClick={publier} disabled={modifier.isPending}>
                <Send />
                Publier
              </Button>
            </>
          ) : (
            <>
              <Button variant="tertiary" size="sm" type="button" onClick={() => onClose?.()}>
                Annuler
              </Button>
              <Button size="sm" type="button" onClick={enregistrer} disabled={modifier.isPending}>
                Enregistrer
              </Button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
