import type { UtilisateurApiModel } from '@pilote/kpilote-shared/utilisateur'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'

import {
  autoriserAssistantUtilisateur,
  modifierAssistantActif,
  retirerAssistantUtilisateur,
} from '@/api/assistant'
import { UtilisateurPicker } from '@/components/UtilisateurPicker'
import { IconButton } from '@pilote/kpilote-ui/IconButton'
import { SegmentedField } from '@pilote/kpilote-ui/SegmentedField'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'
import { assistantAccesQueryOptions, useAssistantAccesMutation } from '@/queries/assistant'

const ACTIF_OPTIONS = [
  { value: 'actif', label: 'Activé' },
  { value: 'coupe', label: 'Coupé' },
] as const

const initiales = (utilisateur: UtilisateurApiModel): string =>
  `${utilisateur.prenom.at(0) ?? ''}${utilisateur.nom.at(0) ?? ''}`.toUpperCase()

export function AssistantAccesPanel() {
  const { data: acces } = useSuspenseQuery(assistantAccesQueryOptions())
  const toast = useToast()
  const onError = (error: unknown) => toast({ title: extractApiError(error), variant: 'error' })

  const actifMutation = useAssistantAccesMutation(modifierAssistantActif, {
    onSuccess: () => toast({ title: 'Accès mis à jour.' }),
    onError,
  })
  const autoriserMutation = useAssistantAccesMutation(autoriserAssistantUtilisateur, {
    onSuccess: () => toast({ title: 'Utilisateur autorisé.' }),
    onError,
  })
  const retirerMutation = useAssistantAccesMutation(retirerAssistantUtilisateur, {
    onSuccess: () => toast({ title: 'Utilisateur retiré.' }),
    onError,
  })
  const pending = autoriserMutation.isPending || retirerMutation.isPending

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border border-border bg-surface p-6">
        <SegmentedField
          label="Assistant"
          value={acces.actif ? 'actif' : 'coupe'}
          onValueChange={(value) => actifMutation.mutate(value === 'actif')}
          options={ACTIF_OPTIONS}
        />
        <p className="mt-3 text-xs text-text-muted">
          {acces.actif
            ? 'Ouvert aux utilisateurs autorisés ci-dessous.'
            : 'Coupé pour tout le monde, utilisateurs autorisés compris.'}
        </p>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-sm font-semibold text-text">
          Utilisateurs autorisés{' '}
          <span className="text-text-muted">({acces.utilisateurs.length})</span>
        </h2>

        <div className="mb-4">
          <UtilisateurPicker
            excludedIds={acces.utilisateurs.map((utilisateur) => utilisateur.id)}
            onSelect={(utilisateur) => autoriserMutation.mutate(utilisateur.id)}
            disabled={pending}
            placeholder="Ajouter un utilisateur…"
          />
        </div>

        {acces.utilisateurs.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">Aucun utilisateur autorisé.</p>
        ) : (
          <ul className="space-y-1">
            {acces.utilisateurs.map((utilisateur) => (
              <li
                key={utilisateur.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-tinted"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {initiales(utilisateur)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-text">
                    {utilisateur.prenom} {utilisateur.nom}
                  </span>
                  <span className="block truncate text-xs text-text-muted">
                    {utilisateur.email}
                  </span>
                </span>
                <IconButton
                  variant="danger"
                  label={`Retirer ${utilisateur.prenom} ${utilisateur.nom}`}
                  disabled={pending}
                  onClick={() => retirerMutation.mutate(utilisateur.id)}
                  className="shrink-0"
                >
                  <Trash2 />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
