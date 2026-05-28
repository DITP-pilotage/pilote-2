import { type FonctionAgregation } from '@pilote/mb-shared/indicateur'

import { yieldToEventLoop } from '@/framework/concurrency'
import { Decimal } from '@/framework/decimal'
import { getFonctionAgregationActive } from '@/indicateur/resolveAgregation'

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

// Async pour pouvoir yielder l'event loop entre les buckets d'une dérivée
// (cf. `computeSerieDerivee` + `yieldToEventLoop`). Sans ce yield, une
// résolution profonde sur un gros arbre (ex. France → ~35k communes) ×
// historique long (5 ans en `dateTrunc='day'`) cumule des centaines de
// milliers d'ops Decimal en synchrone — ~50× plus lentes que des `number`
// natifs — et bloque la node pendant plusieurs secondes, gelant les
// requêtes concurrentes. Le coût micro-task ajouté reste négligeable face
// au temps de calcul lui-même.
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
    const valeursAAgreger: Decimal[] = []

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
      valeursAAgreger.push(courant.valeur)
    }

    // Permissif : on n'émet pas tant qu'aucun enfant n'a saisi ; dès la première
    // valeur connue d'un enfant, le point sort avec une couverture < total.
    if (valeursAAgreger.length === 0) continue

    const valeur = agreger(valeursAAgreger, fonctionAgregation)
    result.push({
      type: 'derivee',
      bucket,
      valeur,
      fonctionAgregation,
      contributions,
      couverture: {
        nbEnfantsAvecValeur: valeursAAgreger.length,
        nbEnfantsTotal: states.length,
      },
    })
  }

  return result
}

// Précondition : `valeurs` est non vide (filtré en amont sur la couverture > 0)
// et `fonction` est active (≠ 'NONE', cf. `getFonctionAgregationActive`).
// `AVG` est une moyenne arithmétique simple non pondérée : chaque enfant connu
// compte pour 1, les enfants sans valeur sont ignorés (cf. cas permissif amont).
const agreger = (valeurs: ReadonlyArray<Decimal>, fonction: FonctionAgregation): Decimal => {
  const somme = valeurs.reduce((acc, v) => acc.plus(v), new Decimal(0))
  switch (fonction) {
    case 'SUM':
      return somme
    case 'AVG':
      return somme.dividedBy(valeurs.length)
    case 'NONE':
      throw new Error(
        "agreger appelé avec fonction 'NONE' : une dérivation ne devrait pas être déclenchée " +
          "lorsque l'agrégation est désactivée.",
      )
  }
}
