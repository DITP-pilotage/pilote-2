import { joinCsv, splitCsv } from '@pilote/kpilote-shared/texte'
import { type QueryClient } from '@tanstack/react-query'

import { groupNodesByRootReferentiel } from '@/lib/individus/hierarchy'
import { normalizeSelection } from '@/lib/individus/selection'
import { loadHierarchyFromReferentiels } from '@/queries/referentiels'

// Charge la hiérarchie des sélecteurs et remet la sélection de l'URL en forme
// (un individu connu par stack, dans l'ordre des stacks). `onChange` redirige
// quand l'URL ne porte pas déjà la sélection normalisée.
export const ensureSelectionIndividus = async ({
  queryClient,
  referentielIds,
  selectedIndividus,
  onChange,
}: {
  queryClient: QueryClient
  referentielIds: ReadonlyArray<string>
  selectedIndividus: string | undefined
  onChange: (selectedIndividus: string | undefined) => never
}): Promise<void> => {
  const nodes = await loadHierarchyFromReferentiels({ queryClient, referentielIds })
  if (selectedIndividus === undefined) return
  const normalized = joinCsv(
    normalizeSelection({
      individus: splitCsv(selectedIndividus),
      groups: groupNodesByRootReferentiel(nodes),
    }),
  )
  if (normalized !== selectedIndividus) onChange(normalized)
}
