import { Eye, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

import { IconButton } from '@pilote/kpilote-ui/IconButton'
import { MultiToggle } from '@pilote/kpilote-ui/MultiToggle'

export type DirectRow = {
  publicId: string
  nom: string
  actions: string[]
}

export type WriteToggleSpec = {
  value: string
  label: string
  isActive: (actions: string[]) => boolean
  onToggle: (publicId: string, wasActive: boolean) => void
}

type PermissionSectionProps = {
  title: string
  rows: DirectRow[]
  addControl: ReactNode
  disabled: boolean
  onRemove: (publicId: string) => void
  writePermissions: WriteToggleSpec[]
  extraForRow?: (publicId: string) => ReactNode
}

export function PermissionSection({
  title,
  rows,
  addControl,
  disabled,
  onRemove,
  writePermissions,
  extraForRow,
}: PermissionSectionProps) {
  return (
    <div className="mb-6">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
        {title}
      </h3>
      <div className="mb-2">{addControl}</div>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-text-subtle">
          Aucune permission directe.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {rows.map((row) => (
            <li key={row.publicId} className="px-3 py-2.5">
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-text">{row.nom}</span>
                  <span className="font-mono text-xs text-text-muted">{row.publicId}</span>
                </span>
                <span className="flex items-center gap-2.5">
                  <span
                    title="Lecture toujours accordée pour une ressource ajoutée. Utilisez la corbeille pour la retirer."
                    className="flex items-center gap-1 text-xs font-medium text-text-muted"
                  >
                    <Eye className="size-3.5" /> Lecture
                  </span>
                  {writePermissions.length > 0 ? (
                    <MultiToggle
                      disabled={disabled}
                      aria-label="Permissions d'écriture"
                      value={writePermissions.filter((s) => s.isActive(row.actions)).map((s) => s.value)}
                      onValueChange={(next: string[]) => {
                        for (const spec of writePermissions) {
                          const wasActive = spec.isActive(row.actions)
                          if (wasActive !== next.includes(spec.value))
                            spec.onToggle(row.publicId, wasActive)
                        }
                      }}
                      options={writePermissions.map((s) => ({ value: s.value, label: s.label }))}
                    />
                  ) : null}
                  <IconButton
                    variant="danger"
                    size="sm"
                    label="Retirer la ressource"
                    disabled={disabled}
                    onClick={() => onRemove(row.publicId)}
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
