import { type IndiceConfiance } from '@pilote/kpilote-shared/niveauConfiance'

import {
  iconeMeteoIndice,
  niveauConfianceFromIndice,
} from '@/components/commentaires/niveauConfianceAffichage'

export function NiveauConfianceTag({ indice }: { indice: IndiceConfiance }) {
  const { label } = niveauConfianceFromIndice(indice)
  return (
    <span className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-normal leading-none text-text">
      <img src={iconeMeteoIndice(indice)} alt="" aria-hidden className="h-6 w-auto shrink-0" />
      {label}
    </span>
  )
}
