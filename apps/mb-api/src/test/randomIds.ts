type FixedTuple<N extends number, T, Acc extends T[] = []> = Acc['length'] extends N
  ? Acc
  : FixedTuple<N, T, [T, ...Acc]>

const uniqueIds = <N extends number>(factory: () => string, count: N): FixedTuple<N, string> => {
  const ids = new Set<string>()
  while (ids.size < count) ids.add(factory())
  return [...ids].sort() as FixedTuple<N, string>
}

// 12 caractères alphanum ⇒ ~10^21 combinaisons : collisions négligeables même
// entre tests parallèles d'un même run (limite la contention de row-locks).
const ALPHANUM = 'abcdefghijklmnopqrstuvwxyz0123456789'
const randomToken = (length: number): string => {
  let out = ''
  for (let i = 0; i < length; i++) out += ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)]
  return out
}

export const testIndicateurId = (): string => `IND-${randomToken(12)}`

export const testReferentielId = (): string => `REF-${randomToken(12)}`

export const testIndividuId = (): string => `TEST-${randomToken(12)}`

export const testWidgetId = (): string => `WID-${randomToken(12).toUpperCase()}`

export const testPanierId = (): string => `PAN-${randomToken(12)}`

// Suffixe aléatoire (et non un code INSEE tiré d'un petit pool) : avec jusqu'à
// 10 transactions concurrentes, piocher parmi 18 régions / ~100 départements
// provoquait des collisions de publicId entre tests → contention de row-locks.
export const testDeptId = (): string => `DEPT-${randomToken(12).toUpperCase()}`

export const testRegId = (): string => `REG-${randomToken(12).toUpperCase()}`

export const testEmail = (): string => `utilisateur-${randomToken(12)}@example.com`

// `pilote_live_<token>` — préfixe imposé par looksLikeApiKey, longueur ≥ 20 pour
// que le slice(0, 20) côté apiKey produise un préfixe stable.
export const testApiKeyRawKey = (): string => `pilote_live_${randomToken(32)}`

export const testIndicateurIds = <N extends number>(n: N): FixedTuple<N, string> =>
  uniqueIds(testIndicateurId, n)

export const testReferentielIds = <N extends number>(n: N): FixedTuple<N, string> =>
  uniqueIds(testReferentielId, n)

export const testDeptIds = <N extends number>(n: N): FixedTuple<N, string> =>
  uniqueIds(testDeptId, n)

export const testRegIds = <N extends number>(n: N): FixedTuple<N, string> => uniqueIds(testRegId, n)
