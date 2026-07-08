import { type IndiceConfiance } from '@pilote/kpilote-shared/niveauConfiance'

import {
  NIVEAUX_CONFIANCE,
  couleurIndice,
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
