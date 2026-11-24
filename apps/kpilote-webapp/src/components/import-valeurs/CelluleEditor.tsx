import { searchUnaccent } from '@pilote/kpilote-shared/texte'
import { parseNombre } from '@pilote/kpilote-shared/valeurImport/parseNombre'
import { Button } from '@pilote/kpilote-ui/Button'
import { Command } from 'cmdk'
import { Check, Search } from 'lucide-react'
import { type FormEvent, useState } from 'react'

import { type CorrectionSaisie } from './edition'
import { type Candidat, type EditionCellule } from './grille'

// Même filtre que `Picker` : sous-chaîne, sans tenir compte de la casse ni des accents.
const commandFilter = (itemValue: string, query: string): number => {
  const needle = searchUnaccent(query)
  if (!needle) return 1
  return searchUnaccent(itemValue).includes(needle) ? 1 : 0
}

type RapprochementEdition = Extract<EditionCellule, { type: 'RAPPROCHEMENT' }>

function RapprochementEditor({
  edition,
  onSelect,
}: {
  edition: RapprochementEdition
  onSelect: (candidat: Candidat) => void
}) {
  return (
    <Command filter={commandFilter} className="w-80">
      <p className="border-b border-border px-3 py-2 text-xs text-text-muted">
        « {edition.libelle} » dans le fichier. Le choix s’applique à toutes les lignes qui portent
        ce libellé.
      </p>
      <div className="flex items-center gap-2 border-b border-border px-3">
        <Search aria-hidden className="size-4 shrink-0 text-text-muted" />
        <Command.Input
          autoFocus
          placeholder="Rechercher…"
          className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-text-subtle"
        />
      </div>
      <Command.List className="max-h-64 overflow-y-auto p-1.5">
        <Command.Empty className="px-3 py-6 text-center text-sm text-text-muted">
          Aucun résultat.
        </Command.Empty>
        {edition.candidats.map((candidat) => (
          <Command.Item
            key={candidat.id}
            value={`${candidat.nom} ${candidat.id}`}
            onSelect={() => onSelect(candidat)}
            className="flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none data-[selected=true]:bg-surface-tinted data-[selected=true]:text-primary"
          >
            <span className="min-w-0 flex-1 truncate">{candidat.nom}</span>
            <span className="font-mono text-[11px] text-text-muted">{candidat.id}</span>
            {candidat.id === edition.selected ? (
              <Check aria-label="Sélectionné" className="size-4 shrink-0 text-primary" />
            ) : null}
          </Command.Item>
        ))}
      </Command.List>
    </Command>
  )
}

const INPUT_CLASS =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:border-primary focus-visible:outline-none'

function DateEditor({ value, onSubmit }: { value: string; onSubmit: (date: string) => void }) {
  const [date, setDate] = useState(value)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (date !== '') onSubmit(date)
  }
  return (
    <form onSubmit={submit} className="flex w-64 flex-col gap-2 p-3">
      <label className="flex flex-col gap-1 text-xs font-medium text-text-muted">
        Date de la valeur
        <input
          autoFocus
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className={INPUT_CLASS}
        />
      </label>
      <Button type="submit" size="sm" disabled={date === ''}>
        Valider
      </Button>
    </form>
  )
}

function ValeurEditor({
  value,
  onSubmit,
}: {
  value: number | null
  onSubmit: (valeur: number) => void
}) {
  const [texte, setTexte] = useState(value === null ? '' : String(value).replace('.', ','))
  const nombre = parseNombre(texte)
  const showError = texte.trim() !== '' && nombre === null
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (nombre !== null) onSubmit(nombre)
  }
  return (
    <form onSubmit={submit} className="flex w-64 flex-col gap-2 p-3">
      <label className="flex flex-col gap-1 text-xs font-medium text-text-muted">
        Valeur
        <input
          autoFocus
          type="text"
          inputMode="decimal"
          value={texte}
          onChange={(event) => setTexte(event.target.value)}
          aria-invalid={showError}
          className={INPUT_CLASS}
        />
      </label>
      {showError ? <p className="text-xs text-red-marianne">Ce n’est pas un nombre.</p> : null}
      <Button type="submit" size="sm" disabled={nombre === null}>
        Valider
      </Button>
    </form>
  )
}

// Éditeur d'une cellule de la grille, selon ce qu'elle porte.
export function CelluleEditor({
  edition,
  onCorrection,
}: {
  edition: EditionCellule
  onCorrection: (correction: CorrectionSaisie) => void
}) {
  switch (edition.type) {
    case 'RAPPROCHEMENT':
      return (
        <RapprochementEditor
          edition={edition}
          onSelect={(candidat) =>
            onCorrection({ type: 'RAPPROCHEMENT', edition, publicId: candidat.id })
          }
        />
      )
    case 'DATE':
      return (
        <DateEditor
          value={edition.value}
          onSubmit={(date) => onCorrection({ type: 'DATE', date })}
        />
      )
    case 'VALEUR':
      return (
        <ValeurEditor
          value={edition.value}
          onSubmit={(valeur) => onCorrection({ type: 'VALEUR', valeur })}
        />
      )
  }
}
