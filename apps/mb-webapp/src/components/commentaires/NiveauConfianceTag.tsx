import { type IndiceConfiance } from '@pilote/mb-shared/niveauConfiance'

import {
  couleurIndice,
  niveauConfianceFromIndice,
} from '@/components/commentaires/niveauConfianceAffichage'
import { clsxm } from '@/lib/clsxm'

export function NiveauConfianceTag({ indice }: { indice: IndiceConfiance }) {
  const { label } = niveauConfianceFromIndice(indice)
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
