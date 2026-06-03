import { type FonctionAgregation } from '@pilote/mb-shared/indicateur'

import { type Bucket, type BucketKey, compareBuckets, formatBucket } from '@/framework/bucket'
import { Decimal } from '@/framework/decimal'
import { agreger, getFonctionAgregationActive } from '@/indicateur/resolveAgregation'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieIndividu'

export type ObjectifSaisieBucketise = {
  bucket: Bucket
  valeur: Decimal
}

export type ResolveObjectifContext = {
  enfantsParParent: ReadonlyMap<string, ReadonlyArray<IndividuRef>>
  fonctionAgregationParReferentiel: ReadonlyMap<string, FonctionAgregation>
  // Une `Map<BucketKey, …>` plutôt qu'un tableau permet la lookup O(1) lors
  // du carry-forward et garantit l'unicité d'un bucket par individu.
  objectifBucketParIndividu: ReadonlyMap<string, ReadonlyMap<BucketKey, ObjectifSaisieBucketise>>
  referentielParIndividu: ReadonlyMap<string, string>
}

export type ContributionObjectifInterne = {
  individuPublicId: string
  valeur: Decimal
  bucketCible: Bucket
  estAgregee: boolean
}

export type PointObjectifInterne =
  | { type: 'saisie'; bucket: Bucket; valeur: Decimal }
  | {
      type: 'derivee'
      bucket: Bucket
      valeur: Decimal
      fonctionAgregation: FonctionAgregation
      contributions: ContributionObjectifInterne[]
    }

export const resolveObjectifIndividu = (
  individuId: string,
  ctx: ResolveObjectifContext,
  cache: Map<string, ReadonlyMap<BucketKey, PointObjectifInterne>>,
): ReadonlyMap<BucketKey, PointObjectifInterne> => {
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
): ReadonlyMap<BucketKey, PointObjectifInterne> => {
  const saisies = ctx.objectifBucketParIndividu.get(individuId)
  const result = new Map<BucketKey, PointObjectifInterne>()
  if (!saisies) return result
  for (const [key, { bucket, valeur }] of saisies) {
    result.set(key, { type: 'saisie', bucket, valeur })
  }
  return result
}

// Carry-forward strict : pour chaque bucket de l'union des buckets enfants, on
// porte la dernière valeur connue de chaque enfant ≤ bucket courant. Si un seul
// enfant n'a pas encore de valeur portée, on n'émet pas de point pour ce bucket.
const computeObjectifDerive = (
  parentId: string,
  ctx: ResolveObjectifContext,
  cache: Map<string, ReadonlyMap<BucketKey, PointObjectifInterne>>,
  fonctionAgregation: FonctionAgregation,
): ReadonlyMap<BucketKey, PointObjectifInterne> => {
  const enfants = ctx.enfantsParParent.get(parentId) ?? []
  const enfantsTries = [...enfants].sort((a, b) => a.publicId.localeCompare(b.publicId))

  type EnfantState = {
    enfant: IndividuRef
    // Buckets triés ASC par `compareBuckets` — les `PointObjectifInterne`
    // correspondants sont accessibles via `values.get(formatBucket(bucket))`.
    buckets: ReadonlyArray<Bucket>
    values: ReadonlyMap<BucketKey, PointObjectifInterne>
    pointer: number
  }

  const states: EnfantState[] = enfantsTries.map((enfant) => {
    const values = resolveObjectifIndividu(enfant.id, ctx, cache)
    const buckets = [...values.values()].map((p) => p.bucket).sort(compareBuckets)
    return { enfant, buckets, values, pointer: -1 }
  })

  const bucketsByKey = new Map<BucketKey, Bucket>()
  for (const state of states) {
    for (const b of state.buckets) {
      const key = formatBucket(b)
      if (!bucketsByKey.has(key)) bucketsByKey.set(key, b)
    }
  }
  const sortedBuckets = [...bucketsByKey.values()].sort(compareBuckets)

  const result = new Map<BucketKey, PointObjectifInterne>()

  for (const bucket of sortedBuckets) {
    // Carry-forward via pointers triés ASC.
    // `state.pointer` = index dans `state.buckets` de la **dernière** valeur
    // de l'enfant dont bucket ≤ B courant (-1 = aucune valeur encore portée).
    // L'union `sortedBuckets` est parcourue ASC : si `buckets[k] ≤ B₁`, alors
    // `buckets[k] ≤ B₂` pour tout B₂ ≥ B₁ → le pointer ne peut qu'avancer,
    // jamais reculer. Coût amorti O(N+E) par enfant (vs O(N×E) si on re-scannait
    // à chaque bucket).
    // Test `[pointer+1] ≤ B` (et non `<`) : un `<` raterait l'égalité quand
    // l'enfant a une valeur **exactement** sur B et on resterait sur la précédente.
    //
    // Exemple — enfant avec buckets = [Jan, Juin] (val 10 puis 20) :
    //   B=Jan  → pointer 0  (val 10)
    //   B=Mar  → pointer 0  (val 10, carry-forward)
    //   B=Juin → pointer 1  (val 20)
    //   B=Aoû  → pointer 1  (val 20, carry-forward — au-delà du dernier bucket)
    for (const state of states) {
      while (
        state.pointer + 1 < state.buckets.length &&
        compareBuckets(state.buckets[state.pointer + 1]!, bucket) <= 0
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
      const bucketCible = state.buckets[state.pointer]!
      const point = state.values.get(formatBucket(bucketCible))!
      contributions.push({
        individuPublicId: state.enfant.publicId,
        valeur: point.valeur,
        bucketCible,
        estAgregee: point.type === 'derivee',
      })
      valeurs.push(point.valeur)
    }

    if (allHaveValue && valeurs.length > 0) {
      result.set(formatBucket(bucket), {
        type: 'derivee',
        bucket,
        valeur: agreger(valeurs, fonctionAgregation),
        fonctionAgregation,
        contributions,
      })
    }
  }

  return result
}
