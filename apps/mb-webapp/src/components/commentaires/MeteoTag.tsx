import { type IndiceConfiance } from '@pilote/mb-shared/niveauConfiance'

import { couleurIndice, meteoFromIndice } from '@/components/commentaires/meteo'
import { clsxm } from '@/lib/clsxm'

export function MeteoTag({ indice }: { indice: IndiceConfiance }) {
  const { label } = meteoFromIndice(indice)
  return (
    <span
      className={clsxm(
        'inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold leading-none',
        couleurIndice(indice).badge,
      )}
    >
      {label}
    </span>
  )
}
