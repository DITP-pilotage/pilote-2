import { useSuspenseQuery } from '@tanstack/react-query'

import {
  iconeMeteoIndice,
  niveauConfianceFromIndice,
} from '@/components/commentaires/niveauConfianceAffichage'
import { Text } from '@pilote/kpilote-ui/Typography'
import { dernierNiveauConfianceQueryOptions } from '@/queries/derniersNiveauxConfiance'

export function IndicateurCardNiveauConfiance({
  indicateurId,
  individus,
}: {
  indicateurId: string
  individus: ReadonlyArray<string> | undefined
}) {
  const { data: dernierNiveau } = useSuspenseQuery(
    dernierNiveauConfianceQueryOptions({ individus, indicateurId }),
  )
  if (!dernierNiveau) {
    return (
      <Text variant="body" tone="muted" className="mt-2">
        Non renseigné
      </Text>
    )
  }
  return (
    <p className="mt-2 flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-text">
      <img
        src={iconeMeteoIndice(dernierNiveau.indice)}
        alt=""
        aria-hidden
        className="h-6 w-auto shrink-0"
      />
      {niveauConfianceFromIndice(dernierNiveau.indice).label}
    </p>
  )
}
