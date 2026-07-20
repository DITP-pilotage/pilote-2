import { type IndiceConfiance } from '@pilote/kpilote-shared/niveauConfiance'

import {
  NIVEAUX_CONFIANCE,
  iconeMeteoIndice,
  meteoLabelIndice,
} from '@/components/commentaires/niveauConfianceAffichage'
import { clsxm } from '@/lib/clsxm'

export function SelecteurNiveauConfiance({
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
      {NIVEAUX_CONFIANCE.map(({ indice, label }) => {
        const actif = value === indice
        return (
          <button
            key={indice}
            type="button"
            disabled={disabled}
            aria-pressed={actif}
            title={label}
            onClick={() => onChange(indice)}
            className={clsxm(
              'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold leading-none transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-60',
              actif
                ? 'border-primary bg-primary-tinted text-primary'
                : 'border-border text-text hover:border-primary',
            )}
          >
            <img
              src={iconeMeteoIndice(indice)}
              alt=""
              aria-hidden
              className="h-6 w-auto shrink-0"
            />
            {meteoLabelIndice(indice)}
          </button>
        )
      })}
    </div>
  )
}
