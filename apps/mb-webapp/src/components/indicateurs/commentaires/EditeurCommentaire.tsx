import { type CommentaireApiModel } from '@pilote/mb-shared/commentaire'
import { type IndiceConfiance } from '@pilote/mb-shared/niveauConfiance'
import { EyeOff, Send } from 'lucide-react'
import { useState } from 'react'

import { type IndicateurIndividuCommentaireType } from '@/api/commentaires'
import { EditeurRiche } from '@/components/editeur-riche/EditeurRiche'
import { BadgeStatut } from '@/components/indicateurs/commentaires/BadgeStatut'
import { libelleAuteur } from '@/components/indicateurs/commentaires/libelleAuteur'
import { SelecteurMeteo } from '@/components/indicateurs/commentaires/SelecteurMeteo'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Typography'
import { clsxm } from '@/lib/clsxm'
import { formatDateHeureFr } from '@/lib/format'
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
  const [indice, setIndice] = useState<IndiceConfiance | undefined>(meteo?.indice)
  const modifier = useModifierCommentaire(indicateurId, individuId, type)
  const { creer: creerMeteo, modifier: modifierMeteo } = useEnregistrerMeteo(
    indicateurId,
    individuId,
  )

  const brouillon = commentaire.statut === 'BROUILLON'
  const enCours = modifier.isPending || creerMeteo.isPending || modifierMeteo.isPending
  // Pour le type Confiance, on bloque la publication tant qu'aucune météo n'est choisie.
  const publicationBloquee = avecMeteo && !indice

  // La météo n'est persistée qu'au moment de l'enregistrement (appel séparé de
  // celui du commentaire), et seulement si elle a changé.
  const persisterMeteo = async () => {
    if (!avecMeteo || !indice || indice === meteo?.indice) return
    if (meteo) {
      await modifierMeteo.mutateAsync({ niveauConfianceId: meteo.niveauId, body: { indice } })
    } else {
      await creerMeteo.mutateAsync({ commentaireId: commentaire.id, indice })
    }
  }

  const sauvegarder = async (statut?: 'PUBLIE') => {
    try {
      await modifier.mutateAsync({
        commentaireId: commentaire.id,
        body: statut ? { contenu, statut } : { contenu },
      })
      await persisterMeteo()
      onClose?.()
    } catch {
      // Les erreurs sont déjà signalées par les toasts des mutations.
    }
  }

  return (
    <article
      className={clsxm(
        'rounded-r-sm border border-l-4 border-border bg-surface p-5 sm:p-6',
        brouillon ? 'border-l-warning' : 'border-l-primary',
      )}
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <BadgeStatut statut={commentaire.statut} />
        {brouillon && (
          <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
            <EyeOff className="size-3.5" />
            Seul vous pouvez voir ce commentaire tant qu'il n'est pas publié.
          </span>
        )}
      </div>

      {avecMeteo && (
        <div className="mb-5">
          <Text variant="caption" weight="semibold" tone="muted" className="mb-2 block">
            Météo
          </Text>
          <SelecteurMeteo value={indice} onChange={setIndice} disabled={enCours} />
        </div>
      )}

      <Text variant="caption" weight="semibold" tone="muted" className="mb-2 block">
        Commentaire
      </Text>
      <EditeurRiche contenu={commentaire.contenu} onChange={setContenu} />

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <Text variant="caption" tone="muted">
          Modifié le {formatDateHeureFr(commentaire.updatedAt)} par{' '}
          {libelleAuteur(commentaire.auteurModification)}
        </Text>
        <div className="ml-auto flex items-center gap-3">
          {brouillon ? (
            <>
              {publicationBloquee && (
                <Text variant="caption" tone="muted">
                  Une météo est requise pour publier.
                </Text>
              )}
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => void sauvegarder()}
                disabled={enCours}
              >
                Enregistrer
              </Button>
              <Button
                size="sm"
                type="button"
                onClick={() => void sauvegarder('PUBLIE')}
                disabled={enCours || publicationBloquee}
              >
                <Send />
                Publier
              </Button>
            </>
          ) : (
            <>
              <Button variant="tertiary" size="sm" type="button" onClick={() => onClose?.()}>
                Annuler
              </Button>
              <Button size="sm" type="button" onClick={() => void sauvegarder()} disabled={enCours}>
                Enregistrer
              </Button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
