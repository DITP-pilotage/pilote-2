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

// `referentielIdsParDefaut` restreint le choix de l'individu par défaut (racine)
// sans restreindre les individus acceptés depuis l'URL. Absent : toute la
// hiérarchie (règle historique).
export const resolveIndividuReferentielPair = (
  nodes: ReadonlyArray<IndividuNode>,
  deps: { individu?: string | undefined; referentiel?: string | undefined },
  referentielIdsParDefaut?: ReadonlyArray<string>,
): PairResolution => {
  if (nodes.length === 0) return { kind: 'no-hierarchy' }
  const known = deps.individu
    ? nodes.find((n) => n.individu.id === deps.individu)?.individu
    : undefined
  if (known && known.referentiel === deps.referentiel) {
    return { kind: 'valid', pair: { individu: known.id, referentiel: known.referentiel } }
  }
  const candidats = referentielIdsParDefaut
    ? nodes.filter((n) => referentielIdsParDefaut.includes(n.individu.referentiel))
    : nodes
  const fallback =
    known ?? pickRoot(candidats)?.individu ?? pickRoot(nodes)?.individu ?? nodes[0]!.individu
  return {
    kind: 'mismatch',
    fallback: { individu: fallback.id, referentiel: fallback.referentiel },
  }
}

export const ensureIndividuReferentielPair = async ({
  queryClient,
  referentielIds,
  referentielIdsParDefaut,
  deps,
  onMismatch,
}: {
  queryClient: QueryClient
  referentielIds: ReadonlyArray<string>
  referentielIdsParDefaut?: ReadonlyArray<string> | undefined
  deps: { individu?: string | undefined; referentiel?: string | undefined }
  onMismatch: (fallback: IndividuReferentielPair) => never
}): Promise<IndividuReferentielPair | null> => {
  if (referentielIds.length === 0) return null
  const nodes = await loadHierarchyFromReferentiels({ queryClient, referentielIds })
  const resolution = resolveIndividuReferentielPair(nodes, deps, referentielIdsParDefaut)
  if (resolution.kind === 'no-hierarchy') return null
  if (resolution.kind === 'mismatch') return onMismatch(resolution.fallback)
  return resolution.pair
}
