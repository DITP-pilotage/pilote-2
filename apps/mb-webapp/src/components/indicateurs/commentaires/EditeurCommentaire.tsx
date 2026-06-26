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
import { useEnregistrerNiveauConfiance } from '@/mutations/niveauConfiance'

export type NiveauConfianceCourant = { niveauId: string; indice: IndiceConfiance }

export function EditeurCommentaire({
  indicateurId,
  individuId,
  type,
  commentaire,
  avecNiveauConfiance,
  niveauConfiance,
  onClose,
}: {
  indicateurId: string
  individuId: string
  type: IndicateurIndividuCommentaireType
  commentaire: CommentaireApiModel
  avecNiveauConfiance: boolean
  niveauConfiance?: NiveauConfianceCourant | undefined
  onClose?: (() => void) | undefined
}) {
  const [contenu, setContenu] = useState(commentaire.contenu)
  const [indice, setIndice] = useState<IndiceConfiance | undefined>(niveauConfiance?.indice)
  const modifier = useModifierCommentaire(indicateurId, individuId, type)
  const { creer: creerNiveau, modifier: modifierNiveau } = useEnregistrerNiveauConfiance(
    indicateurId,
    individuId,
  )

  const brouillon = commentaire.statut === 'BROUILLON'
  const enCours = modifier.isPending || creerNiveau.isPending || modifierNiveau.isPending
  // Pour le type Confiance, on bloque la publication tant qu'aucun indice n'est choisi.
  const publicationBloquee = avecNiveauConfiance && !indice

  // Le niveau de confiance n'est persisté qu'au moment de l'enregistrement (appel séparé de
  // celui du commentaire), et seulement s'il a changé.
  const persisterNiveauConfiance = async () => {
    if (!avecNiveauConfiance || !indice || indice === niveauConfiance?.indice) return
    if (niveauConfiance) {
      await modifierNiveau.mutateAsync({
        niveauConfianceId: niveauConfiance.niveauId,
        body: { indice },
      })
    } else {
      await creerNiveau.mutateAsync({ commentaireId: commentaire.id, indice })
    }
  }

  const sauvegarder = async (statut?: 'PUBLIE') => {
    try {
      await persisterNiveauConfiance()
      await modifier.mutateAsync({
        commentaireId: commentaire.id,
        body: statut ? { contenu, statut } : { contenu },
      })
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

      {avecNiveauConfiance && (
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
