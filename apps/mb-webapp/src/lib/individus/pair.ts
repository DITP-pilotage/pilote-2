import { type QueryClient } from '@tanstack/react-query'

import { type IndividuNode, pickRoot } from '@/lib/individus/hierarchy'
import { loadHierarchyFromReferentiels } from '@/queries/referentiels'

export type IndividuReferentielPair = {
  individu: string
  referentiel: string
}

export type PairResolution =
  | { kind: 'no-hierarchy' }
  | { kind: 'valid'; pair: IndividuReferentielPair }
  | { kind: 'mismatch'; fallback: IndividuReferentielPair }

export const resolveIndividuReferentielPair = (
  nodes: ReadonlyArray<IndividuNode>,
  deps: { individu?: string | undefined; referentiel?: string | undefined },
): PairResolution => {
  if (nodes.length === 0) return { kind: 'no-hierarchy' }
  const known = deps.individu
    ? nodes.find((n) => n.individu.id === deps.individu)?.individu
    : undefined
  if (known && known.referentiel === deps.referentiel) {
    return { kind: 'valid', pair: { individu: known.id, referentiel: known.referentiel } }
  }
  const fallback = known ?? pickRoot(nodes)?.individu ?? nodes[0]!.individu
  return {
    kind: 'mismatch',
    fallback: { individu: fallback.id, referentiel: fallback.referentiel },
  }
}

export const ensureIndividuReferentielPair = async ({
  queryClient,
  referentielIds,
  deps,
  onMismatch,
}: {
  queryClient: QueryClient
  referentielIds: ReadonlyArray<string>
  deps: { individu?: string | undefined; referentiel?: string | undefined }
  onMismatch: (fallback: IndividuReferentielPair) => never
}): Promise<IndividuReferentielPair | null> => {
  if (referentielIds.length === 0) return null
  const nodes = await loadHierarchyFromReferentiels({ queryClient, referentielIds })
  const resolution = resolveIndividuReferentielPair(nodes, deps)
  if (resolution.kind === 'no-hierarchy') return null
  if (resolution.kind === 'mismatch') return onMismatch(resolution.fallback)
  return resolution.pair
}
