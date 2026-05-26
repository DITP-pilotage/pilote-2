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

// Un individu est agrégé pour cet indicateur s'il a au moins un enfant direct
// ET que son référentiel est configuré avec une fonction d'agrégation active
// (≠ 'NONE'). On compare à 'NONE' plutôt qu'à 'SUM' pour rester valable quand
// d'autres fonctions (AVG, MIN, ...) seront ajoutées à l'enum.
export const getFonctionAgregationActive = (
  individuId: string,
  ctx: ResolveSerieContext,
): FonctionAgregation | null => {
  const enfants = ctx.enfantsParParent.get(individuId)
  if (!enfants || enfants.length === 0) return null
  const referentielId = ctx.referentielParIndividu.get(individuId)
  if (!referentielId) return null
  const fonction = ctx.fonctionAgregationParReferentiel.get(referentielId)
  if (!fonction || fonction === 'NONE') return null
  return fonction
}

// Async pour pouvoir yielder l'event loop entre les buckets d'une dérivée
// (cf. `computeSerieDerivee`). Sans ce yield, une résolution profonde sur un
// gros arbre (ex. France → ~35k communes) × historique long (5 ans en
// `dateTrunc='day'`) cumule des centaines de milliers d'ops Decimal en
// synchrone — ~50× plus lentes que des `number` natifs — et bloque la node
// pendant plusieurs secondes, gelant les requêtes concurrentes. Le coût
// micro-task ajouté reste négligeable face au temps de calcul lui-même.
export const resolveSerieIndividu = async (
  individuId: string,
  ctx: ResolveSerieContext,
  cache: Map<string, ReadonlyArray<PointInterne>>,
): Promise<ReadonlyArray<PointInterne>> => {
  const cached = cache.get(individuId)
  if (cached) return cached

  const fonctionAgregation = getFonctionAgregationActive(individuId, ctx)
  const serie = fonctionAgregation
    ? await computeSerieDerivee(individuId, ctx, cache, fonctionAgregation)
    : computeSerieSaisie(individuId, ctx)

  cache.set(individuId, serie)
  return serie
}

const yieldToEventLoop = (): Promise<void> =>
  new Promise((resolve) => setImmediate(resolve))

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

// Calcule la série dérivée d'un parent par combineLatest permissif sur ses
// enfants directs (cf. design doc D3) :
// - Pour chaque bucket distinct rencontré dans une série enfant, on émet un
//   point dérivé qui agrège les "dernières valeurs connues" de chaque enfant
//   à cette date (carry-forward).
// - On émet dès qu'au moins un enfant a une valeur (≠ rxjs strict) ; les
//   enfants sans valeur connue figurent en `manquante`.
// - Implémentation linéaire O(N×E) via pointers triés ASC : on n'utilise pas
//   binary search car les buckets sont déjà parcourus en ordre croissant.
// - Récursion + mémoïsation via `resolveSerieIndividu` : la série d'un enfant
//   intermédiaire (ex. région) n'est calculée qu'une fois même si plusieurs
//   parents (ou plusieurs cibles dans la même requête) la sollicitent.
const computeSerieDerivee = async (
  parentId: string,
  ctx: ResolveSerieContext,
  cache: Map<string, ReadonlyArray<PointInterne>>,
  fonctionAgregation: FonctionAgregation,
): Promise<ReadonlyArray<PointInterne>> => {
  const enfants = ctx.enfantsParParent.get(parentId) ?? []
  // Tri stable par publicId pour des contributions déterministes en sortie.
  const enfantsTries = [...enfants].sort((a, b) => a.publicId.localeCompare(b.publicId))

  type EnfantState = {
    enfant: IndividuRef
    points: ReadonlyArray<PointInterne>
    estAgrege: boolean
    pointer: number // index de la dernière valeur ≤ bucket courant (-1 = aucune)
  }
  // Résolution séquentielle des enfants : la mémoïsation garantit que chaque
  // sous-arbre n'est calculé qu'une fois, donc le parallélisme n'apporterait
  // rien et empêcherait le yield bucket-par-bucket d'avoir l'effet voulu.
  const states: EnfantState[] = []
  for (const enfant of enfantsTries) {
    states.push({
      enfant,
      points: await resolveSerieIndividu(enfant.id, ctx, cache),
      estAgrege: getFonctionAgregationActive(enfant.id, ctx) !== null,
      pointer: -1,
    })
  }

  // Union des buckets distincts présents dans une série enfant (triés ASC).
  const bucketsSet = new Set<string>()
  for (const state of states) {
    for (const point of state.points) bucketsSet.add(point.bucket)
  }
  const buckets = [...bucketsSet].sort()

  const result: PointInterne[] = []

  for (const bucket of buckets) {
    // Yield à chaque bucket : voir doc en tête de `resolveSerieIndividu`.
    await yieldToEventLoop()
    // Avance chaque pointer tant que la valeur suivante de l'enfant est ≤ au
    // bucket courant (carry-forward). Comme les buckets sont parcourus ASC,
    // les pointers ne reculent jamais → coût amorti O(N+E) par enfant.
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
      // Pour un enfant feuille (saisie) on expose la date d'origine pré-troncature ;
      // pour un enfant déjà dérivé, on n'a que la date de son bucket le plus récent.
      const dateOrigine = courant.type === 'saisie' ? courant.dateOrigine : courant.bucket
      contributions.push({
        individuPublicId: state.enfant.publicId,
        valeur: courant.valeur,
        dateOrigine,
        source: state.estAgrege ? 'derivee' : 'saisie',
      })
      valeursPourSomme.push(courant.valeur)
    }

    // Permissif : on n'émet pas tant qu'aucun enfant n'a saisi ; dès la première
    // valeur connue d'un enfant, le point sort avec une couverture < total.
    if (valeursPourSomme.length === 0) continue

    const somme = valeursPourSomme.reduce((acc, v) => acc.plus(v), new Decimal(0))
    result.push({
      type: 'derivee',
      bucket,
      valeur: somme,
      fonctionAgregation,
      contributions,
      couverture: {
        nbEnfantsAvecValeur: valeursPourSomme.length,
        nbEnfantsTotal: states.length,
      },
    })
  }

  return result
}
