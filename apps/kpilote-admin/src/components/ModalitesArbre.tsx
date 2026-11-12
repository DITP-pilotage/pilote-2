import { type ModaliteApiModel, type NiveauAxeApiModel } from '@pilote/kpilote-shared/axe'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { deleteModalite, upsertModalite } from '@/api/axes'
import { Button } from '@pilote/kpilote-ui/Button'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { IconButton } from '@pilote/kpilote-ui/IconButton'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'

const INPUT =
  'rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none'

const MODALITE_ID = /^[A-Z][A-Z0-9-]{0,19}$/

// Le formulaire d'ajout s'ouvre sous un parent (ou à la racine, parent null).
type Ajout = { parent: string | null; id: string; nom: string }
type Renommage = { id: string; nom: string }

export function ModalitesArbre({
  axeId,
  niveaux,
  modalites,
  disabled,
}: {
  axeId: string
  niveaux: ReadonlyArray<NiveauAxeApiModel>
  modalites: ReadonlyArray<ModaliteApiModel>
  disabled: boolean
}) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [ajout, setAjout] = useState<Ajout | null>(null)
  const [renommage, setRenommage] = useState<Renommage | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  const enfantsDe = (parent: string | null) => modalites.filter((m) => m.parent === parent)
  const nomNiveau = (ordre: number) =>
    niveaux.find((n) => n.ordre === ordre)?.nom ?? `Niveau ${ordre}`

  const onError = (error: unknown) => toast({ title: extractApiError(error), variant: 'error' })
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['axe', axeId] })
    await queryClient.invalidateQueries({ queryKey: ['axes'] })
  }

  const enregistrer = useMutation({
    mutationFn: ({
      id,
      nom,
      parent,
    }: {
      id: string
      nom: string
      parent: string | null
      renommage: boolean
    }) => upsertModalite({ axeId, id, body: { nom: nom.trim(), parent } }),
    onSuccess: async (_data, variables) => {
      await refresh()
      toast({
        title: variables.renommage ? 'Modalité renommée.' : `Modalité ${variables.id} ajoutée.`,
      })
      setAjout(null)
      setRenommage(null)
    },
    onError,
  })

  const supprimer = useMutation({
    mutationFn: (id: string) => deleteModalite({ axeId, id }),
    onSuccess: async () => {
      await refresh()
      setConfirmation(null)
      toast({ title: 'Modalité supprimée.' })
    },
    onError,
  })

  const occupe = disabled || enregistrer.isPending || supprimer.isPending

  const formulaireAjout = (niveau: number) =>
    ajout ? (
      <form
        className="my-2 flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-surface-tinted px-3 py-2"
        onSubmit={(event) => {
          event.preventDefault()
          enregistrer.mutate({
            id: ajout.id,
            nom: ajout.nom,
            parent: ajout.parent,
            renommage: false,
          })
        }}
      >
        <span className="text-xs font-semibold text-text-muted">{nomNiveau(niveau)}</span>
        <input
          value={ajout.id}
          onChange={(event) => setAjout({ ...ajout, id: event.target.value.toUpperCase() })}
          aria-label="Identifiant de la modalité"
          placeholder="OP-ORANGE"
          className={`${INPUT} w-44 font-mono`}
        />
        <input
          value={ajout.nom}
          onChange={(event) => setAjout({ ...ajout, nom: event.target.value })}
          aria-label="Nom de la modalité"
          placeholder="Orange"
          className={`${INPUT} min-w-48 flex-1`}
        />
        <Button type="button" variant="secondary" size="sm" onClick={() => setAjout(null)}>
          Annuler
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={occupe || !MODALITE_ID.test(ajout.id) || ajout.nom.trim() === ''}
        >
          Ajouter
        </Button>
      </form>
    ) : null

  const noeud = (modalite: ModaliteApiModel) => {
    const enfants = enfantsDe(modalite.id)
    const peutAvoirEnfants = modalite.niveau < niveaux.length
    const enRenommage = renommage?.id === modalite.id

    return (
      <li key={modalite.id}>
        <div className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-surface-muted">
          <span className="w-40 shrink-0 font-mono text-xs text-primary">{modalite.id}</span>
          {enRenommage ? (
            <form
              className="flex flex-1 items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                enregistrer.mutate({
                  id: modalite.id,
                  nom: renommage.nom,
                  parent: modalite.parent,
                  renommage: true,
                })
              }}
            >
              <input
                value={renommage.nom}
                onChange={(event) => setRenommage({ id: modalite.id, nom: event.target.value })}
                aria-label={`Nouveau nom de ${modalite.id}`}
                className={`${INPUT} flex-1`}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setRenommage(null)}
              >
                Annuler
              </Button>
              <Button type="submit" size="sm" disabled={occupe || renommage.nom.trim() === ''}>
                Renommer
              </Button>
            </form>
          ) : (
            <span className="flex-1 text-sm">{modalite.nom}</span>
          )}
          <span className="inline-flex shrink-0 gap-1">
            {peutAvoirEnfants ? (
              <IconButton
                label={`Ajouter une modalité sous ${modalite.id}`}
                disabled={occupe}
                onClick={() => setAjout({ parent: modalite.id, id: '', nom: '' })}
              >
                <Plus />
              </IconButton>
            ) : null}
            <IconButton
              label={`Renommer ${modalite.id}`}
              disabled={occupe}
              onClick={() => setRenommage({ id: modalite.id, nom: modalite.nom })}
            >
              <Pencil />
            </IconButton>
            {enfants.length > 0 ? null : confirmation === modalite.id ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmation(null)}
                  disabled={supprimer.isPending}
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={() => supprimer.mutate(modalite.id)}
                  disabled={occupe}
                  className="bg-red-marianne hover:bg-red-marianne"
                >
                  Supprimer
                </Button>
              </>
            ) : (
              <IconButton
                variant="danger"
                label={`Supprimer ${modalite.id}`}
                disabled={occupe}
                onClick={() => setConfirmation(modalite.id)}
              >
                <Trash2 />
              </IconButton>
            )}
          </span>
        </div>
        {(enfants.length > 0 || ajout?.parent === modalite.id) && (
          <div className="ml-6 border-l border-border pl-4">
            {ajout?.parent === modalite.id ? formulaireAjout(modalite.niveau + 1) : null}
            <ul className="m-0 list-none p-0">{enfants.map(noeud)}</ul>
          </div>
        )}
      </li>
    )
  }

  const racines = enfantsDe(null)

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="m-0 text-xs text-text-muted">
          Le parent d’une modalité est fixé à sa création : pour la déplacer, la supprimer puis la
          recréer. Une modalité qui a des enfants ne peut pas être supprimée.
        </p>
        <Button
          type="button"
          size="sm"
          disabled={occupe}
          onClick={() => setAjout({ parent: null, id: '', nom: '' })}
        >
          <Plus className="size-4" /> {nomNiveau(1)}
        </Button>
      </div>
      {ajout?.parent === null ? formulaireAjout(1) : null}
      {racines.length === 0 && ajout === null ? (
        <EmptyState title="Aucune modalité" description="Ajoutez la première modalité de l’axe." />
      ) : (
        <ul className="m-0 list-none p-0">{racines.map(noeud)}</ul>
      )}
    </div>
  )
}
