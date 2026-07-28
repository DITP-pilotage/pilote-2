import { Trash2 } from 'lucide-react'
import { useFieldArray, useWatch } from 'react-hook-form'

import { useIndicateurFormContext } from '@/components/indicateurs/indicateurFormContext'
import { UtilisateurPicker } from '@/components/UtilisateurPicker'
import { IconButton } from '@pilote/kpilote-ui/IconButton'
import { Subtitle } from '@pilote/kpilote-ui/Subtitle'

export function AdminResponsables() {
  const form = useIndicateurFormContext()
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'responsables' })
  const responsablesSelectionnes = useWatch({ control: form.control, name: 'responsables' })
  const selectedIds = (responsablesSelectionnes ?? []).map((responsable) => responsable.id)

  return (
    <div className="border-t border-border pt-5">
      <span className="mb-1 block text-sm font-bold">Responsables</span>
      <Subtitle className="mb-4">
        Utilisateurs désignés responsables de l'indicateur. Cette liste remplace{' '}
        <b>intégralement</b> l'existant à l'enregistrement.
      </Subtitle>

      <UtilisateurPicker
        excludedIds={selectedIds}
        onSelect={(utilisateur) =>
          append({
            id: utilisateur.id,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            email: utilisateur.email,
          })
        }
      />

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
            <IconButton variant="danger" label="Retirer" onClick={() => remove(index)}>
              <Trash2 />
            </IconButton>
          </li>
        ))}
      </ul>
    </div>
  )
}
