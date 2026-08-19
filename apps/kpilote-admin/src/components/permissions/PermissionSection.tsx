import { Eye, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  Controller,
  useFieldArray,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form'

import { IconButton } from '@pilote/kpilote-ui/IconButton'
import { MultiToggle } from '@pilote/kpilote-ui/MultiToggle'

export type PermissionRow<TWrite extends string> = {
  publicId: string
  nom: string
  writeActions: TWrite[]
}

export type WriteActionOption<TWrite extends string> = {
  value: TWrite
  label: string
}

type PermissionSectionProps<TValues extends FieldValues, TWrite extends string> = {
  title: string
  control: Control<TValues>
  name: Path<TValues>
  writeActions: readonly WriteActionOption<TWrite>[]
  addControl: (append: (row: PermissionRow<TWrite>) => void, publicIds: string[]) => ReactNode
  disabled: boolean
  nouveauxPublicIds: ReadonlySet<string>
  extraForRow?: (publicId: string) => ReactNode
}

export function PermissionSection<TValues extends FieldValues, TWrite extends string>({
  title,
  control,
  name,
  writeActions,
  addControl,
  disabled,
  nouveauxPublicIds,
  extraForRow,
}: PermissionSectionProps<TValues, TWrite>) {
  const { fields, append, remove } = useFieldArray({ control, name: name as never })
  const rows = fields as unknown as (PermissionRow<TWrite> & { id: string })[]

  return (
    <div className="mb-6">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
        {title}
      </h3>
      <div className="mb-2">
        {addControl(
          (row) => append(row as never),
          rows.map((row) => row.publicId),
        )}
      </div>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-text-subtle">
          Aucune permission directe.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {rows.map((row, index) => (
            <li key={row.id} className="px-3 py-2.5">
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-text">{row.nom}</span>
                  <span className="font-mono text-xs text-text-muted">{row.publicId}</span>
                </span>
                {nouveauxPublicIds.has(row.publicId) ? (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    nouveau
                  </span>
                ) : null}
                <span className="flex items-center gap-2.5">
                  <span
                    title="Lecture toujours accordée pour une ressource ajoutée. Utilisez la corbeille pour la retirer."
                    className="flex items-center gap-1 text-xs font-medium text-text-muted"
                  >
                    <Eye className="size-3.5" /> Lecture
                  </span>
                  {writeActions.length > 0 ? (
                    <Controller
                      control={control}
                      name={`${name}.${index}.writeActions` as Path<TValues>}
                      render={({ field }) => (
                        <MultiToggle
                          disabled={disabled}
                          aria-label="Permissions d'écriture"
                          value={field.value as TWrite[]}
                          onValueChange={field.onChange}
                          options={writeActions}
                        />
                      )}
                    />
                  ) : null}
                  <IconButton
                    variant="danger"
                    size="sm"
                    label="Retirer la ressource"
                    disabled={disabled}
                    onClick={() => remove(index)}
                    className="ml-1"
                  >
                    <Trash2 />
                  </IconButton>
                </span>
              </div>
              {extraForRow?.(row.publicId)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
