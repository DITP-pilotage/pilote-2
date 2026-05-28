import { type FonctionAgregation } from '@pilote/mb-shared/indicateur'

import { Decimal } from '@/framework/decimal'
import { getFonctionAgregationActive } from '@/indicateur/resolveAgregation'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieIndividu'

export type ResolveObjectifContext = {
  enfantsParParent: ReadonlyMap<string, ReadonlyArray<IndividuRef>>
  fonctionAgregationParReferentiel: ReadonlyMap<string, FonctionAgregation>
  objectifBucketParIndividu: ReadonlyMap<string, ReadonlyMap<string, Decimal>>
  referentielParIndividu: ReadonlyMap<string, string>
}

export const resolveObjectifIndividu = (
  individuId: string,
  ctx: ResolveObjectifContext,
  cache: Map<string, ReadonlyMap<string, Decimal>>,
): ReadonlyMap<string, Decimal> => {
  const cached = cache.get(individuId)
  if (cached) return cached

  const fonctionAgregation = getFonctionAgregationActive(individuId, ctx)
  const result = fonctionAgregation
    ? computeObjectifDerive(individuId, ctx, cache, fonctionAgregation)
    : (ctx.objectifBucketParIndividu.get(individuId) ?? new Map())

  cache.set(individuId, result)
  return result
}

// Carry-forward strict : pour chaque bucket de l'union des buckets enfants, on
// porte la dernière valeur connue de chaque enfant ≤ bucket courant. Si un seul
// enfant n'a pas encore de valeur portée, on n'émet pas de point pour ce bucket.
const computeObjectifDerive = (
  parentId: string,
  ctx: ResolveObjectifContext,
  cache: Map<string, ReadonlyMap<string, Decimal>>,
  fonctionAgregation: FonctionAgregation,
): ReadonlyMap<string, Decimal> => {
  const enfants = ctx.enfantsParParent.get(parentId) ?? []
  const enfantsTries = [...enfants].sort((a, b) => a.publicId.localeCompare(b.publicId))

  type EnfantState = {
    buckets: string[]
    values: ReadonlyMap<string, Decimal>
    pointer: number
  }

  const states: EnfantState[] = enfantsTries.map((enfant) => {
    const values = resolveObjectifIndividu(enfant.id, ctx, cache)
    const buckets = [...values.keys()].sort()
    return { buckets, values, pointer: -1 }
  })

  const allBuckets = new Set<string>()
  for (const state of states) {
    for (const b of state.buckets) allBuckets.add(b)
  }
  const sortedBuckets = [...allBuckets].sort()

  const result = new Map<string, Decimal>()

  for (const bucket of sortedBuckets) {
    for (const state of states) {
      while (
        state.pointer + 1 < state.buckets.length &&
        state.buckets[state.pointer + 1]! <= bucket
      ) {
        state.pointer++
      }
    }

    const valeurs: Decimal[] = []
    let allHaveValue = true
    for (const state of states) {
      if (state.pointer < 0) {
        allHaveValue = false
        break
      }
      valeurs.push(state.values.get(state.buckets[state.pointer]!)!)
    }

    if (allHaveValue && valeurs.length > 0) {
      result.set(bucket, agreger(valeurs, fonctionAgregation))
    }
  }

  return result
}

const agreger = (valeurs: ReadonlyArray<Decimal>, fonction: FonctionAgregation): Decimal => {
  const somme = valeurs.reduce((acc, v) => acc.plus(v), new Decimal(0))
  switch (fonction) {
    case 'SUM':
      return somme
    case 'AVG':
      return somme.dividedBy(valeurs.length)
    case 'NONE':
      throw new Error("agreger appelé avec fonction 'NONE'")
  }
}
