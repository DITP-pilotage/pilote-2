import { type IndiceConfiance } from '@pilote/mb-shared/niveauConfiance'

import { METEOS } from '@/components/indicateurs/commentaires/meteo'
import { clsxm } from '@/lib/clsxm'

export function SelecteurMeteo({
  value,
  onChange,
  disabled = false,
}: {
  value?: IndiceConfiance | undefined
  onChange: (indice: IndiceConfiance) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {METEOS.map(({ indice, label, Icon }) => {
        const actif = value === indice
        return (
          <button
            key={indice}
            type="button"
            disabled={disabled}
            aria-pressed={actif}
            onClick={() => onChange(indice)}
            className={clsxm(
              'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-60',
              actif
                ? 'border-primary-tinted bg-primary-tinted text-primary'
                : 'border-border bg-surface text-text-muted hover:border-border-strong',
            )}
          >
            <Icon className="size-5" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
