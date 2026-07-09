import { useSuspenseQuery } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useFieldArray, useWatch } from 'react-hook-form'

import { useIndicateurFormContext } from '@/components/indicateurs/indicateurFormContext'
import { FieldSelect } from '@/components/ui/FieldSelect'
import { utilisateursAllQueryOptions } from '@/queries/utilisateurs'

export function AdminResponsables() {
  const form = useIndicateurFormContext()
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'responsables' })
  const responsablesSelectionnes = useWatch({ control: form.control, name: 'responsables' })
  const { data: utilisateurs } = useSuspenseQuery(utilisateursAllQueryOptions())

  const utilisateursDisponibles = utilisateurs.filter(
    (utilisateur) =>
      !(responsablesSelectionnes ?? []).some((responsable) => responsable.id === utilisateur.id),
  )

  return (
    <div className="border-t border-border pt-5">
      <span className="mb-1 block text-sm font-bold">Responsables</span>
      <p className="mb-4 text-xs text-text-subtle">
        Utilisateurs désignés responsables de l'indicateur. Cette liste remplace{' '}
        <b>intégralement</b> l'existant à l'enregistrement.
      </p>

      <FieldSelect
        label="Ajouter un responsable"
        value=""
        onChange={(event) => {
          const utilisateur = utilisateursDisponibles.find(
            (candidat) => candidat.id === event.target.value,
          )
          if (!utilisateur) return
          append({
            id: utilisateur.id,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            email: utilisateur.email,
          })
        }}
      >
        <option value="" disabled>
          Choisir un utilisateur…
        </option>
        {utilisateursDisponibles.map((utilisateur) => (
          <option key={utilisateur.id} value={utilisateur.id}>
            {utilisateur.prenom} {utilisateur.nom} · {utilisateur.email}
          </option>
        ))}
      </FieldSelect>

      <ul className="mt-3 space-y-2">
        {fields.map((responsable, index) => (
          <li
            key={responsable.id}
            className="flex items-center justify-between rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
          >
            <span>
              {responsable.prenom} {responsable.nom}{' '}
              <span className="text-text-subtle">· {responsable.email}</span>
            </span>
            <button
              type="button"
              onClick={() => remove(index)}
              className="text-accent"
              aria-label="Retirer"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
