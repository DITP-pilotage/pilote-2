import { type IndiceConfiance } from '@pilote/mb-shared/niveauConfiance'

import { meteoFromIndice } from '@/components/indicateurs/commentaires/meteo'

export function MeteoTag({ indice }: { indice: IndiceConfiance }) {
  const { label, Icon } = meteoFromIndice(indice)
  return (
    <span className="inline-flex items-center gap-2 rounded-xl bg-primary-tinted px-4 py-2 text-sm font-semibold text-primary">
      <Icon className="size-5" />
      {label}
    </span>
  )
}
