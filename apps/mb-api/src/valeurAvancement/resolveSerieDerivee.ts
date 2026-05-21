import { type FonctionAgregation } from '@pilote/mb-shared/indicateur'

import { Decimal } from '@/framework/decimal'

export type IndividuRef = {
  id: string
  publicId: string
  referentielId: string
}

export type SaisieTronquee = {
  bucket: string
  dateOrigine: string
  valeur: Decimal
}

export type ContributionInterne = {
  individuPublicId: string
  valeur: Decimal | null
  dateOrigine: string | null
  source: 'saisie' | 'derivee' | 'manquante'
}

export type PointInterne =
  | { type: 'saisie'; bucket: string; dateOrigine: string; valeur: Decimal }
  | {
      type: 'derivee'
      bucket: string
      valeur: Decimal
      fonctionAgregation: FonctionAgregation
      contributions: ContributionInterne[]
      couverture: { nbEnfantsAvecValeur: number; nbEnfantsTotal: number }
    }

export type ResolveSerieContext = {
  enfantsParParent: ReadonlyMap<string, ReadonlyArray<IndividuRef>>
  fonctionAgregationParReferentiel: ReadonlyMap<string, FonctionAgregation>
  serieFeuilleParIndividu: ReadonlyMap<string, ReadonlyArray<SaisieTronquee>>
  referentielParIndividu: ReadonlyMap<string, string>
}

export const isIndividuAgrege = (individuId: string, ctx: ResolveSerieContext): boolean => {
  const enfants = ctx.enfantsParParent.get(individuId)
  if (!enfants || enfants.length === 0) return false
  const referentielId = ctx.referentielParIndividu.get(individuId)
  if (!referentielId) return false
  return ctx.fonctionAgregationParReferentiel.get(referentielId) === 'SUM'
}

export const resolveSerieIndividu = (
  individuId: string,
  ctx: ResolveSerieContext,
  cache: Map<string, ReadonlyArray<PointInterne>>,
): ReadonlyArray<PointInterne> => {
  const cached = cache.get(individuId)
  if (cached) return cached

  const serie = isIndividuAgrege(individuId, ctx)
    ? computeSerieDerivee(individuId, ctx, cache)
    : computeSerieSaisie(individuId, ctx)

  cache.set(individuId, serie)
  return serie
}

const computeSerieSaisie = (
  individuId: string,
  ctx: ResolveSerieContext,
): ReadonlyArray<PointInterne> => {
  const saisies = ctx.serieFeuilleParIndividu.get(individuId) ?? []
  return saisies.map(({ bucket, dateOrigine, valeur }) => ({
    type: 'saisie',
    bucket,
    dateOrigine,
    valeur,
  }))
}

const computeSerieDerivee = (
  parentId: string,
  ctx: ResolveSerieContext,
  cache: Map<string, ReadonlyArray<PointInterne>>,
): ReadonlyArray<PointInterne> => {
  const enfants = ctx.enfantsParParent.get(parentId) ?? []
  const enfantsTries = [...enfants].sort((a, b) => a.publicId.localeCompare(b.publicId))

  type EnfantState = {
    enfant: IndividuRef
    points: ReadonlyArray<PointInterne>
    estAgrege: boolean
    pointer: number
  }
  const states: EnfantState[] = enfantsTries.map((enfant) => ({
    enfant,
    points: resolveSerieIndividu(enfant.id, ctx, cache),
    estAgrege: isIndividuAgrege(enfant.id, ctx),
    pointer: -1,
  }))

  const bucketsSet = new Set<string>()
  for (const state of states) {
    for (const point of state.points) bucketsSet.add(point.bucket)
  }
  const buckets = [...bucketsSet].sort()

  const result: PointInterne[] = []

  for (const bucket of buckets) {
    for (const state of states) {
      while (
        state.pointer + 1 < state.points.length &&
        state.points[state.pointer + 1]!.bucket <= bucket
      ) {
        state.pointer++
      }
    }

    const contributions: ContributionInterne[] = []
    const valeursPourSomme: Decimal[] = []

    for (const state of states) {
      const courant = state.pointer >= 0 ? state.points[state.pointer] : undefined
      if (!courant) {
        contributions.push({
          individuPublicId: state.enfant.publicId,
          valeur: null,
          dateOrigine: null,
          source: 'manquante',
        })
        continue
      }
      const dateOrigine = courant.type === 'saisie' ? courant.dateOrigine : courant.bucket
      contributions.push({
        individuPublicId: state.enfant.publicId,
        valeur: courant.valeur,
        dateOrigine,
        source: state.estAgrege ? 'derivee' : 'saisie',
      })
      valeursPourSomme.push(courant.valeur)
    }

    if (valeursPourSomme.length === 0) continue

    const somme = valeursPourSomme.reduce((acc, v) => acc.plus(v), new Decimal(0))
    result.push({
      type: 'derivee',
      bucket,
      valeur: somme,
      fonctionAgregation: 'SUM',
      contributions,
      couverture: {
        nbEnfantsAvecValeur: valeursPourSomme.length,
        nbEnfantsTotal: states.length,
      },
    })
  }

  return result
}
