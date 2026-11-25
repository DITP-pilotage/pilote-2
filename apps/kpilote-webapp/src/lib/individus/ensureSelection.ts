import { type QueryClient } from '@tanstack/react-query'

import { groupNodesByRootReferentiel } from '@/lib/individus/hierarchy'
import {
  normalizeSelection,
  parseIndividusParam,
  serializeIndividusParam,
} from '@/lib/individus/selection'
import { loadHierarchyFromReferentiels } from '@/queries/referentiels'

// Charge la hiérarchie des sélecteurs et remet la sélection de l'URL en forme
// (un individu connu par stack, dans l'ordre des stacks). `onChange` redirige
// quand l'URL ne porte pas déjà la sélection normalisée.
export const ensureSelectionIndividus = async ({
  queryClient,
  referentielIds,
  individus,
  onChange,
}: {
  queryClient: QueryClient
  referentielIds: ReadonlyArray<string>
  individus: string | undefined
  onChange: (individus: string | undefined) => never
}): Promise<void> => {
  const nodes = await loadHierarchyFromReferentiels({ queryClient, referentielIds })
  if (individus === undefined) return
  const normalized = serializeIndividusParam(
    normalizeSelection({
      individus: parseIndividusParam(individus),
      groups: groupNodesByRootReferentiel(nodes),
    }),
  )
  if (normalized !== individus) onChange(normalized)
}
