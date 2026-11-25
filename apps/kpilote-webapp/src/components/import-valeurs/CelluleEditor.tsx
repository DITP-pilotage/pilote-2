import { zodResolver } from '@hookform/resolvers/zod'
import { searchUnaccent } from '@pilote/kpilote-shared/texte'
import { parseNombre } from '@pilote/kpilote-shared/valeurImport/parseNombre'
import { Button } from '@pilote/kpilote-ui/Button'
import { FieldInput } from '@pilote/kpilote-ui/FieldInput'
import { Command } from 'cmdk'
import { Check, Search } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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

const dateFormSchema = z.object({
  date: z.string().min(1, 'Choisissez une date.'),
})

function DateEditor({ value, onSubmit }: { value: string; onSubmit: (date: string) => void }) {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(dateFormSchema),
    mode: 'onChange',
    defaultValues: { date: value },
  })
  return (
    <form
      onSubmit={(event) => void handleSubmit(({ date }) => onSubmit(date))(event)}
      className="flex w-64 flex-col gap-2 p-3"
    >
      <FieldInput
        label="Date de la valeur"
        type="date"
        autoFocus
        error={formState.errors.date?.message}
        {...register('date')}
      />
      <Button type="submit" size="sm" disabled={!formState.isValid}>
        Valider
      </Button>
    </form>
  )
}

// Le champ reste du texte : on y tape « 12,4 » comme dans un tableur, et
// `parseNombre` lit les deux séparateurs décimaux.
const valeurFormSchema = z.object({
  valeur: z.string().transform((texte, context) => {
    const nombre = parseNombre(texte)
    if (nombre !== null) return nombre
    const message = texte.trim() === '' ? 'Saisissez une valeur.' : 'Ce n’est pas un nombre.'
    context.addIssue({ code: 'custom', message })
    return z.NEVER
  }),
})

function ValeurEditor({
  value,
  onSubmit,
}: {
  value: number | null
  onSubmit: (valeur: number) => void
}) {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(valeurFormSchema),
    mode: 'onChange',
    defaultValues: { valeur: value === null ? '' : String(value).replace('.', ',') },
  })
  return (
    <form
      onSubmit={(event) => void handleSubmit(({ valeur }) => onSubmit(valeur))(event)}
      className="flex w-64 flex-col gap-2 p-3"
    >
      <FieldInput
        label="Valeur"
        type="text"
        inputMode="decimal"
        autoFocus
        error={formState.errors.valeur?.message}
        aria-invalid={formState.errors.valeur !== undefined}
        {...register('valeur')}
      />
      <Button type="submit" size="sm" disabled={!formState.isValid}>
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
