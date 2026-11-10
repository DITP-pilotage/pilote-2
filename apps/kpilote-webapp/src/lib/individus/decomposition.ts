import { type IndividuNode } from '@/lib/individus/hierarchy'
import {
  celluleIdDepuisCoordonnees,
  type Coordonnee,
  type DimensionCellule,
} from '@/lib/individus/cellule'

// Plafond de séries d'un graphique décomposé : au-delà, la légende et les
// couleurs ne sont plus lisibles.
export const MAX_SERIES_DECOMPOSITION = 12

export type SerieDecomposee = {
  // Cellule demandée à l'API pour cette série.
  cellule: string
  individu: string
  nom: string
}

export type Decomposition = {
  series: ReadonlyArray<SerieDecomposee>
  // Nombre de membres candidats avant plafonnement.
  total: number
}

// Membres selon lesquels décomposer une dimension, depuis la position courante
// dans sa hiérarchie (`nodes` = individus des niveaux de la dimension) :
// - coordonnée fixée : ses enfants déclarés (vide si c'est une feuille) ;
// - « Tous » : les racines, en descendant tant qu'il n'y en a qu'une (France →
//   régions) — une série unique égale à la marginale n'apporte rien.
export const membresDecomposition = ({
  nodes,
  individu,
}: {
  nodes: ReadonlyArray<IndividuNode>
  individu: string | null
}): IndividuNode[] => {
  const enfantsDe = (parent: string) =>
    nodes.filter((node) => node.individu.parents.includes(parent))
  if (individu !== null) return enfantsDe(individu)
  let membres = nodes.filter((node) => node.depth === 0)
  while (membres.length === 1) {
    const enfants = enfantsDe(membres[0]!.individu.id)
    if (enfants.length === 0) break
    membres = enfants
  }
  return membres
}

// Une série par membre : la cellule courante dont la coordonnée de la dimension
// décomposée est remplacée par le membre. Plafonné à `max` séries.
export const construireDecomposition = ({
  coordonnees,
  dimensions,
  dimension,
  membres,
  max = MAX_SERIES_DECOMPOSITION,
}: {
  coordonnees: ReadonlyArray<Coordonnee>
  dimensions: ReadonlyArray<DimensionCellule>
  dimension: string
  membres: ReadonlyArray<IndividuNode>
  max?: number
}): Decomposition => {
  const autres = coordonnees.filter((c) => c.dimension !== dimension)
  return {
    total: membres.length,
    series: membres.slice(0, max).map((membre) => ({
      cellule: celluleIdDepuisCoordonnees({
        coordonnees: [
          ...autres,
          {
            dimension,
            individu: membre.individu.id,
            referentiel: membre.individu.referentiel,
          },
        ],
        dimensions,
      }),
      individu: membre.individu.id,
      nom: membre.individu.nom,
    })),
  }
}
