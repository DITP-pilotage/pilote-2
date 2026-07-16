import { Plus, Trash2 } from 'lucide-react'

import type { HeaderPair } from '@/api/console'
import { Button } from '@pilote/kpilote-ui/Button'

export function HeadersEditor({
  headers,
  onChange,
}: {
  headers: HeaderPair[]
  onChange: (headers: HeaderPair[]) => void
}) {
  const update = (index: number, patch: Partial<HeaderPair>) => {
    onChange(headers.map((header, i) => (i === index ? { ...header, ...patch } : header)))
  }
  const remove = (index: number) => onChange(headers.filter((_, i) => i !== index))
  const add = () => onChange([...headers, { key: '', value: '' }])

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-text-muted">
        L'en-tête <code>Authorization</code> est injecté côté serveur — inutile de l'ajouter ici.
      </p>
      {headers.map((header, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            aria-label="Nom de l'en-tête"
            value={header.key}
            onChange={(event) => update(index, { key: event.target.value })}
            placeholder="Content-Type"
            className="w-1/3 rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <input
            aria-label="Valeur de l'en-tête"
            value={header.value}
            onChange={(event) => update(index, { value: event.target.value })}
            placeholder="application/json"
            className="flex-1 rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={() => remove(index)}
            aria-label="Supprimer l'en-tête"
            className="text-text-muted hover:text-accent-rouge"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      <div>
        <Button type="button" variant="tertiary" size="sm" onClick={add}>
          <Plus className="size-4" /> Ajouter un en-tête
        </Button>
      </div>
    </div>
  )
}
