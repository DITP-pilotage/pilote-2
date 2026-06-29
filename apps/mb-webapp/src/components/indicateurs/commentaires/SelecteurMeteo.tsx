import { type IndiceConfiance } from '@pilote/mb-shared/niveauConfiance'

import { METEOS, couleurIndice } from '@/components/indicateurs/commentaires/meteo'
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
      {METEOS.map(({ indice, label }) => {
        const actif = value === indice
        const couleur = couleurIndice(indice)
        return (
          <button
            key={indice}
            type="button"
            disabled={disabled}
            aria-pressed={actif}
            onClick={() => onChange(indice)}
            className={clsxm(
              'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold leading-none transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-60',
              actif ? couleur.actif : couleur.inactif,
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
