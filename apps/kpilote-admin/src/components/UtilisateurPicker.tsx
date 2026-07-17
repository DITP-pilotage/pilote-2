import { useSuspenseQuery } from '@tanstack/react-query'

import { Picker } from '@pilote/kpilote-ui/Picker'
import { utilisateursAllQueryOptions } from '@/queries/utilisateurs'

type UtilisateurOption = { id: string; nom: string; prenom: string; email: string }

// Contrôle d'ajout : sélectionner un utilisateur appelle onSelect avec l'objet complet.
export function UtilisateurPicker({
  excludedIds,
  onSelect,
  disabled,
  placeholder = 'Ajouter un responsable',
}: {
  excludedIds: string[]
  onSelect: (utilisateur: UtilisateurOption) => void
  disabled?: boolean
  placeholder?: string
}) {
  const { data } = useSuspenseQuery(utilisateursAllQueryOptions())
  const excluded = new Set(excludedIds)
  const items = data.filter((utilisateur) => !excluded.has(utilisateur.id))

  return (
    <Picker
      items={items}
      onSelect={onSelect}
      getKey={(utilisateur) => utilisateur.id}
      getSearchText={(utilisateur) =>
        `${utilisateur.prenom} ${utilisateur.nom} ${utilisateur.email}`
      }
      renderItem={(utilisateur) => (
        <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <span className="truncate text-sm text-text">
            {utilisateur.prenom} {utilisateur.nom}
          </span>
          <span className="shrink-0 truncate font-mono text-xs text-text-muted">
            {utilisateur.email}
          </span>
        </span>
      )}
      triggerLabel={placeholder}
      disabled={disabled ?? false}
    />
  )
}
