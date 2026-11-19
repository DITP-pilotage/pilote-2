import { modalitePublicIdSchema } from '@pilote/kpilote-shared/axe'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import { PANEL_INPUT } from '@/components/axe-graphe/panelInput'
import { Button } from '@pilote/kpilote-ui/Button'
import { type Arbre, type ArbreNode } from '@/lib/axeArbre'
import { suggestModaliteId } from '@/lib/axeGraphe'
import { clsxm } from '@/lib/clsxm'
import { type AxeEdition } from '@/mutations/axes'

export function AddModaliteForm({
  parent,
  niveauNomOf,
  arbre,
  edition,
  locked,
  onCreated,
}: {
  parent: ArbreNode | null
  niveauNomOf: (ordre: number) => string
  arbre: Arbre
  edition: AxeEdition
  locked: boolean
  onCreated: (id: string) => void
}) {
  const niveau = parent ? parent.niveau + 1 : 1
  const [nom, setNom] = useState('')
  const [typedId, setTypedId] = useState<string | null>(null)
  const id = typedId ?? suggestModaliteId({ nom, parent: parent?.id ?? null })
  const isIdValid = modalitePublicIdSchema.safeParse(id).success
  const isDuplicate = arbre.has(id)
  const canSubmit = nom.trim() !== '' && isIdValid && !isDuplicate

  return (
    <form
      className="flex flex-col gap-4 text-sm"
      onSubmit={(event) => {
        event.preventDefault()
        edition.saveModalite({
          id,
          nom,
          parent: parent?.id ?? null,
          onSuccess: () => onCreated(id),
        })
      }}
    >
      <div>
        <p className="text-xs text-text-muted">Nouvelle modalité</p>
        <h3 className="mt-1 text-lg font-semibold text-text">
          {parent ? `Sous ${parent.nom}` : 'Au premier niveau'}
        </h3>
        <p className="text-xs text-text-muted">
          Elle sera au niveau {niveau} « {niveauNomOf(niveau)} »
          {parent
            ? `, et ${parent.nom} deviendra (ou restera) une modalité parente.`
            : ', directement sous « Tous ».'}
        </p>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-text">Nom</span>
        <input
          autoFocus
          value={nom}
          disabled={locked}
          onChange={(event) => setNom(event.target.value)}
          placeholder="Orange"
          className={PANEL_INPUT}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-text">Identifiant</span>
        <input
          value={id}
          disabled={locked}
          onChange={(event) => setTypedId(event.target.value.toUpperCase())}
          placeholder="OP-ORANGE"
          className={clsxm(PANEL_INPUT, 'font-mono')}
        />
        <span className={clsxm('text-xs', isDuplicate ? 'text-error' : 'text-text-subtle')}>
          {isDuplicate
            ? 'Cet identifiant existe déjà dans l’axe.'
            : 'Majuscules, chiffres et tirets, 20 caractères au plus. Non modifiable ensuite.'}
        </span>
      </label>
      <Button
        type="submit"
        size="sm"
        className="self-start"
        disabled={locked || edition.isPending || !canSubmit}
      >
        <Plus /> Ajouter
      </Button>
    </form>
  )
}
