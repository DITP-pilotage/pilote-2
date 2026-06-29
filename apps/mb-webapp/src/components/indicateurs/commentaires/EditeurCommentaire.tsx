import { type CommentaireApiModel } from '@pilote/mb-shared/commentaire'
import { type IndiceConfiance, indiceConfianceSchema } from '@pilote/mb-shared/niveauConfiance'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSuspenseQuery } from '@tanstack/react-query'
import { EyeOff, Send } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

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
import { niveauPourCommentaireQueryOptions } from '@/queries/niveauConfiance'

const editeurFormSchema = z.object({
  contenu: z.string(),
  indice: indiceConfianceSchema.optional(),
})
type EditeurFormValues = z.infer<typeof editeurFormSchema>

export type NiveauConfianceCourant = { niveauId: string; indice: IndiceConfiance }

type EditeurProps = {
  indicateurId: string
  individuId: string
  type: IndicateurIndividuCommentaireType
  commentaire: CommentaireApiModel
  avecNiveauConfiance: boolean
  onClose?: (() => void) | undefined
}

export function EditeurCommentaire(props: EditeurProps) {
  if (props.avecNiveauConfiance) {
    return <EditeurAvecNiveauConfiance {...props} />
  }
  return <EditeurInterne {...props} niveauConfiance={undefined} />
}

function EditeurAvecNiveauConfiance(props: EditeurProps) {
  const { data: niveau } = useSuspenseQuery(
    niveauPourCommentaireQueryOptions(props.indicateurId, props.individuId, props.commentaire.id),
  )
  const niveauConfiance: NiveauConfianceCourant | undefined = niveau
    ? { niveauId: niveau.id, indice: niveau.indice }
    : undefined
  return <EditeurInterne {...props} niveauConfiance={niveauConfiance} />
}

function EditeurInterne({
  indicateurId,
  individuId,
  type,
  commentaire,
  avecNiveauConfiance,
  niveauConfiance,
  onClose,
}: EditeurProps & { niveauConfiance: NiveauConfianceCourant | undefined }) {
  const form = useForm<EditeurFormValues>({
    resolver: zodResolver(editeurFormSchema),
    defaultValues: { contenu: commentaire.contenu, indice: niveauConfiance?.indice },
  })
  const modifier = useModifierCommentaire(indicateurId, individuId, type)
  const { creer: creerNiveau, modifier: modifierNiveau } = useEnregistrerNiveauConfiance(
    indicateurId,
    individuId,
  )

  const brouillon = commentaire.statut === 'BROUILLON'
  const enCours = modifier.isPending || creerNiveau.isPending || modifierNiveau.isPending
  const indiceSelectionne = useWatch({ control: form.control, name: 'indice' })
  // Pour le type Confiance, on bloque la publication tant qu'aucun indice n'est choisi.
  const publicationBloquee = avecNiveauConfiance && !indiceSelectionne

  // Le niveau de confiance n'est persisté qu'au moment de l'enregistrement
  // (appel séparé de celui du commentaire), et seulement s'il a changé.
  const persisterNiveauConfiance = async (indice: IndiceConfiance | undefined) => {
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

  const soumettre = (statut?: 'PUBLIE') => {
    const handler = form.handleSubmit(async (values) => {
      try {
        // Niveau d'abord : la publication exige un niveau côté API.
        await persisterNiveauConfiance(values.indice)
        await modifier.mutateAsync({
          commentaireId: commentaire.id,
          body: statut ? { contenu: values.contenu, statut } : { contenu: values.contenu },
        })
        onClose?.()
      } catch {
        // Les erreurs sont déjà signalées par les toasts des mutations.
      }
    })
    return (event?: React.BaseSyntheticEvent) => {
      void handler(event)
    }
  }

  return (
    <article
      className={clsxm(
        'rounded-r-sm border border-l-4 border-border bg-surface p-5 sm:p-6',
        brouillon ? 'border-l-warning' : 'border-l-primary',
      )}
    >
      <form onSubmit={soumettre()} noValidate>
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
              Niveau de confiance
            </Text>
            <Controller
              control={form.control}
              name="indice"
              render={({ field }) => (
                <SelecteurMeteo value={field.value} onChange={field.onChange} disabled={enCours} />
              )}
            />
          </div>
        )}

        <Text variant="caption" weight="semibold" tone="muted" className="mb-2 block">
          Commentaire
        </Text>
        <Controller
          control={form.control}
          name="contenu"
          render={({ field }) => <EditeurRiche contenu={field.value} onChange={field.onChange} />}
        />

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
                    Un niveau de confiance est requis pour publier.
                  </Text>
                )}
                <Button variant="secondary" size="sm" type="submit" disabled={enCours}>
                  Enregistrer
                </Button>
                <Button
                  size="sm"
                  type="button"
                  onClick={soumettre('PUBLIE')}
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
                <Button size="sm" type="submit" disabled={enCours}>
                  Enregistrer
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </article>
  )
}
