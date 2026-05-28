import { type FonctionAgregation } from '@pilote/mb-shared/indicateur'

import { Decimal } from '@/framework/decimal'
import { agreger, getFonctionAgregationActive } from '@/indicateur/resolveAgregation'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieIndividu'

export type ResolveObjectifContext = {
  enfantsParParent: ReadonlyMap<string, ReadonlyArray<IndividuRef>>
  fonctionAgregationParReferentiel: ReadonlyMap<string, FonctionAgregation>
  objectifBucketParIndividu: ReadonlyMap<string, ReadonlyMap<string, Decimal>>
  referentielParIndividu: ReadonlyMap<string, string>
}

export type ContributionObjectifInterne = {
  individuPublicId: string
  valeur: Decimal
  dateCible: string
  estAgregee: boolean
}

export type PointObjectifInterne =
  | { type: 'saisie'; valeur: Decimal }
  | {
      type: 'derivee'
      valeur: Decimal
      fonctionAgregation: FonctionAgregation
      contributions: ContributionObjectifInterne[]
    }

export const resolveObjectifIndividu = (
  individuId: string,
  ctx: ResolveObjectifContext,
  cache: Map<string, ReadonlyMap<string, PointObjectifInterne>>,
): ReadonlyMap<string, PointObjectifInterne> => {
  const cached = cache.get(individuId)
  if (cached) return cached

  const fonctionAgregation = getFonctionAgregationActive(individuId, ctx)
  const result = fonctionAgregation
    ? computeObjectifDerive(individuId, ctx, cache, fonctionAgregation)
    : buildSaisieMap(individuId, ctx)

  cache.set(individuId, result)
  return result
}

const buildSaisieMap = (
  individuId: string,
  ctx: ResolveObjectifContext,
): ReadonlyMap<string, PointObjectifInterne> => {
  const saisies = ctx.objectifBucketParIndividu.get(individuId) ?? new Map<string, Decimal>()
  const result = new Map<string, PointObjectifInterne>()
  for (const [bucket, valeur] of saisies) {
    result.set(bucket, { type: 'saisie', valeur })
  }
  return result
}

// Carry-forward strict : pour chaque bucket de l'union des buckets enfants, on
// porte la dernière valeur connue de chaque enfant ≤ bucket courant. Si un seul
// enfant n'a pas encore de valeur portée, on n'émet pas de point pour ce bucket.
const computeObjectifDerive = (
  parentId: string,
  ctx: ResolveObjectifContext,
  cache: Map<string, ReadonlyMap<string, PointObjectifInterne>>,
  fonctionAgregation: FonctionAgregation,
): ReadonlyMap<string, PointObjectifInterne> => {
  const enfants = ctx.enfantsParParent.get(parentId) ?? []
  const enfantsTries = [...enfants].sort((a, b) => a.publicId.localeCompare(b.publicId))

  type EnfantState = {
    enfant: IndividuRef
    buckets: string[]
    values: ReadonlyMap<string, PointObjectifInterne>
    pointer: number
  }

  const states: EnfantState[] = enfantsTries.map((enfant) => {
    const values = resolveObjectifIndividu(enfant.id, ctx, cache)
    const buckets = [...values.keys()].sort()
    return { enfant, buckets, values, pointer: -1 }
  })

  const allBuckets = new Set<string>()
  for (const state of states) {
    for (const b of state.buckets) allBuckets.add(b)
  }
  const sortedBuckets = [...allBuckets].sort()

  const result = new Map<string, PointObjectifInterne>()

  for (const bucket of sortedBuckets) {
    for (const state of states) {
      while (
        state.pointer + 1 < state.buckets.length &&
        state.buckets[state.pointer + 1]! <= bucket
      ) {
        state.pointer++
      }
    }

    const contributions: ContributionObjectifInterne[] = []
    const valeurs: Decimal[] = []
    let allHaveValue = true
    for (const state of states) {
      if (state.pointer < 0) {
        allHaveValue = false
        break
      }
      const dateCible = state.buckets[state.pointer]!
      const point = state.values.get(dateCible)!
      contributions.push({
        individuPublicId: state.enfant.publicId,
        valeur: point.valeur,
        dateCible,
        estAgregee: point.type === 'derivee',
      })
      valeurs.push(point.valeur)
    }

    if (allHaveValue && valeurs.length > 0) {
      result.set(bucket, {
        type: 'derivee',
        valeur: agreger(valeurs, fonctionAgregation),
        fonctionAgregation,
        contributions,
      })
    }
  }

  return result
}
