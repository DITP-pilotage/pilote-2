import { type FonctionAgregation } from '@pilote/kpilote-shared/indicateur'

import { cleCellule, individuIdsDeCle } from '@/dimension/cellule'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieIndividu'

// Functional core du calcul multi-dimension (cf. dimensions-design.md §5 « Décision »).
// Construit, à partir de cellules cibles, le graphe de résolution consommé tel
// quel par les cœurs existants (`resolveSerieIndividu`, `resolveObjectifIndividu`) :
// un nœud = une cellule, ses enfants = les cellules obtenues en éclatant UNE
// coordonnée selon l'ordre canonique des dimensions.

export type MembreCube = {
  id: string
  publicId: string
  referentielId: string
  dimensionId: string
}

export type DimensionCube = {
  dimensionId: string
  // Fonction de la racine virtuelle (marginale « tous »).
  fonctionMarginale: FonctionAgregation
  fonctionParNiveau: ReadonlyMap<string, FonctionAgregation>
}

export type TopologieCube = {
  // Triées par ordre de remontée (la première = opération la plus externe).
  dimensions: ReadonlyArray<DimensionCube>
  membres: ReadonlyMap<string, MembreCube>
  // Restreints aux niveaux déclarés par l'indicateur, dans une même dimension.
  enfantsParMembre: ReadonlyMap<string, ReadonlyArray<string>>
  parentsParMembre: ReadonlyMap<string, ReadonlyArray<string>>
  // Membres sans parent dans un niveau déclaré : enfants de la racine virtuelle.
  racinesParDimension: ReadonlyMap<string, ReadonlyArray<string>>
}

// dimensionId → individuId. Dimension absente = « tous » (marginale).
export type Coordonnees = ReadonlyMap<string, string>

export const cleDeCoordonnees = (coordonnees: Coordonnees): string =>
  cleCellule([...coordonnees.values()])

export const publicIdDeCoordonnees = (topologie: TopologieCube, coordonnees: Coordonnees): string =>
  topologie.dimensions
    .map((dimension) => coordonnees.get(dimension.dimensionId))
    .filter((id): id is string => id !== undefined)
    .map((id) => topologie.membres.get(id)?.publicId ?? id)
    .join('~')

const ancetresOuSoi = (topologie: TopologieCube, individuId: string): string[] => {
  const result: string[] = []
  const visites = new Set<string>()
  const pile = [individuId]
  while (pile.length > 0) {
    const courant = pile.pop()!
    if (visites.has(courant)) continue
    visites.add(courant)
    result.push(courant)
    pile.push(...(topologie.parentsParMembre.get(courant) ?? []))
  }
  return result
}

// Support : clés de toutes les cellules (complètes ou partielles) dont le
// sous-cube contient au moins une cellule portant une valeur. Une coordonnée
// d'une dimension hors topologie est projetée (ignorée) : c'est ainsi que le
// support des objectifs se déduit des valeurs (sous-cube des objectifs).
export const buildSupport = ({
  topologie,
  clesAvecValeurs,
}: {
  topologie: TopologieCube
  clesAvecValeurs: ReadonlyArray<string>
}): Set<string> => {
  const support = new Set<string>()
  for (const cle of clesAvecValeurs) {
    const optionsParDimension: Array<Array<string | undefined>> = []
    for (const dimension of topologie.dimensions) {
      const membre = individuIdsDeCle(cle).find(
        (id) => topologie.membres.get(id)?.dimensionId === dimension.dimensionId,
      )
      optionsParDimension.push(
        membre === undefined ? [undefined] : [undefined, ...ancetresOuSoi(topologie, membre)],
      )
    }
    let combinaisons: string[][] = [[]]
    for (const options of optionsParDimension) {
      combinaisons = combinaisons.flatMap((prefixe) =>
        options.map((option) => (option === undefined ? prefixe : [...prefixe, option])),
      )
    }
    for (const ids of combinaisons) {
      if (ids.length > 0) support.add(cleCellule(ids))
    }
  }
  return support
}

type Eclatement = {
  dimensionId: string
  enfants: ReadonlyArray<string>
  fonction: FonctionAgregation
}

// Première dimension (ordre canonique) dont la coordonnée est éclatable : membre
// à enfants dans un niveau déclaré avec une fonction ≠ NONE, ou coordonnée absente
// (racine virtuelle → membres racines, fonction de la marginale).
const trouverEclatement = (
  topologie: TopologieCube,
  coordonnees: Coordonnees,
): Eclatement | null => {
  for (const dimension of topologie.dimensions) {
    const membreId = coordonnees.get(dimension.dimensionId)
    const enfants =
      membreId === undefined
        ? (topologie.racinesParDimension.get(dimension.dimensionId) ?? [])
        : (topologie.enfantsParMembre.get(membreId) ?? [])
    const fonction =
      membreId === undefined
        ? dimension.fonctionMarginale
        : dimension.fonctionParNiveau.get(topologie.membres.get(membreId)?.referentielId ?? '')
    if (enfants.length > 0 && fonction && fonction !== 'NONE') {
      return { dimensionId: dimension.dimensionId, enfants, fonction }
    }
  }
  return null
}

export type GrapheCube = {
  cibles: IndividuRef[]
  noeuds: Map<string, IndividuRef>
  enfantsParParent: Map<string, IndividuRef[]>
  // Clé synthétique : `referentielParIndividu(noeud) = noeud`, et la fonction
  // d'agrégation du nœud est rangée sous cette clé. Permet de réutiliser
  // `getFonctionAgregationActive` sans le modifier.
  fonctionAgregationParReferentiel: Map<string, FonctionAgregation>
  referentielParIndividu: Map<string, string>
}

export const buildGrapheCube = ({
  topologie,
  support,
  cibles,
}: {
  topologie: TopologieCube
  support: ReadonlySet<string>
  cibles: ReadonlyArray<Coordonnees>
}): GrapheCube => {
  const noeuds = new Map<string, IndividuRef>()
  const enfantsParParent = new Map<string, IndividuRef[]>()
  const fonctionAgregationParReferentiel = new Map<string, FonctionAgregation>()
  const referentielParIndividu = new Map<string, string>()

  const toRef = (coordonnees: Coordonnees): IndividuRef => {
    const cle = cleDeCoordonnees(coordonnees)
    return { id: cle, publicId: publicIdDeCoordonnees(topologie, coordonnees), referentielId: cle }
  }

  const ciblesRefs = cibles.map(toRef)
  const file: Coordonnees[] = [...cibles]
  while (file.length > 0) {
    const coordonnees = file.shift()!
    const ref = toRef(coordonnees)
    if (noeuds.has(ref.id)) continue
    noeuds.set(ref.id, ref)
    referentielParIndividu.set(ref.id, ref.id)

    const eclatement = trouverEclatement(topologie, coordonnees)
    if (!eclatement) continue
    const candidats = eclatement.enfants.map((enfant) =>
      new Map(coordonnees).set(eclatement.dimensionId, enfant),
    )
    // Marginale pure sur la dimension éclatée (aucune autre coordonnée fixée) :
    // la hiérarchie définit la population attendue, comme en mono-dimension.
    // Sinon (cube creux) : seules les combinaisons observées au moins une fois.
    const margePure = [...coordonnees.keys()].every((id) => id === eclatement.dimensionId)
    const attendus = margePure
      ? candidats
      : candidats.filter((candidat) => support.has(cleDeCoordonnees(candidat)))
    // Aucun enfant attendu : le nœud est une feuille (on lit ses saisies).
    if (attendus.length === 0) continue
    enfantsParParent.set(ref.id, attendus.map(toRef))
    fonctionAgregationParReferentiel.set(ref.id, eclatement.fonction)
    file.push(...attendus)
  }

  return {
    cibles: ciblesRefs,
    noeuds,
    enfantsParParent,
    fonctionAgregationParReferentiel,
    referentielParIndividu,
  }
}
