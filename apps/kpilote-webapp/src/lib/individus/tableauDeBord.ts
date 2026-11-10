import { type IndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { type ReferentielApiModel } from '@pilote/kpilote-shared/referentiel'

type IndicateurDimensions = Pick<IndicateurApiModel, 'dimensions'>

// Référentiels proposés par le sélecteur d'individu des tableaux de bord.
//
// Le contexte d'un tableau de bord est une population commune aux indicateurs
// (en pratique le territoire) ; sur un indicateur multi-dimension elle
// s'applique comme marginale (« DEPT-84, tous opérateurs »). Une dimension qui
// n'apparaît que croisée (Opérateur, Type de fraude…) est une ventilation, qu'on
// explore depuis la fiche : ses référentiels sont écartés du sélecteur.
//
// Sans aucun indicateur multi-dimension lisible, règle historique exacte : tous
// les référentiels `scope=me`. Si l'exclusion ne laissait rien, on garde la
// dimension portée par le plus d'indicateurs.
export const referentielsTableauDeBord = <R extends Pick<ReferentielApiModel, 'id' | 'dimension'>>({
  referentiels,
  indicateurs,
}: {
  referentiels: ReadonlyArray<R>
  indicateurs: ReadonlyArray<IndicateurDimensions>
}): R[] => {
  if (!indicateurs.some((indicateur) => indicateur.dimensions.length > 1)) return [...referentiels]

  const dimensionsMono = new Set(
    indicateurs.flatMap((indicateur) =>
      indicateur.dimensions.length === 1 ? [indicateur.dimensions[0]!.id] : [],
    ),
  )
  const frequence = new Map<string, number>()
  for (const indicateur of indicateurs) {
    for (const dimension of indicateur.dimensions) {
      frequence.set(dimension.id, (frequence.get(dimension.id) ?? 0) + 1)
    }
  }

  // Dimension inconnue des indicateurs lisibles : conservée (prudence).
  const retenus = referentiels.filter(
    (r) => dimensionsMono.has(r.dimension) || !frequence.has(r.dimension),
  )
  if (retenus.length > 0) return retenus

  const [plusFrequente] = [...frequence.entries()].sort(
    ([idA, a], [idB, b]) => b - a || idA.localeCompare(idB),
  )
  return plusFrequente ? referentiels.filter((r) => r.dimension === plusFrequente[0]) : []
}

// Fiche collection : le sélecteur du tableau de bord, plus les dimensions
// croisées des indicateurs multi-dimension de la collection (vue « opérateur »
// d'une collection mixte, cf. dimensions-design.md §5.7). Identique au tableau
// de bord pour une collection 100 % mono.
export const referentielsCollection = <R extends Pick<ReferentielApiModel, 'id' | 'dimension'>>({
  referentiels,
  indicateurs,
  indicateursCollection,
}: {
  referentiels: ReadonlyArray<R>
  indicateurs: ReadonlyArray<IndicateurDimensions>
  indicateursCollection: ReadonlyArray<IndicateurDimensions>
}): R[] => {
  const base = new Set(referentielsTableauDeBord({ referentiels, indicateurs }).map((r) => r.id))
  const dimensionsCroisees = new Set(
    indicateursCollection.flatMap((indicateur) =>
      indicateur.dimensions.length > 1 ? indicateur.dimensions.map((d) => d.id) : [],
    ),
  )
  return referentiels.filter((r) => base.has(r.id) || dimensionsCroisees.has(r.dimension))
}
