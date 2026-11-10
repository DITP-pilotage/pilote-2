import { type IndividuNode } from '@/lib/individus/hierarchy'
import {
  type Coordonnee,
  dimensionParReferentiel,
  type DimensionCellule,
} from '@/lib/individus/cellule'

// Le membre et tous ses ancêtres connus. `parents` liste aussi les parents dont
// le niveau n'est pas déclaré sur l'indicateur (non chargés) : on les garde,
// sans pouvoir remonter au-delà.
const ancetresOuSoi = (
  individu: string,
  nodeById: ReadonlyMap<string, IndividuNode>,
): ReadonlySet<string> => {
  const vus = new Set<string>()
  const pile = [individu]
  while (pile.length > 0) {
    const courant = pile.pop()!
    if (vus.has(courant)) continue
    vus.add(courant)
    pile.push(...(nodeById.get(courant)?.individu.parents ?? []))
  }
  return vus
}

// Cellule dans le périmètre d'écriture (cf. dimensions-design.md §5.10) : ET
// entre dimensions, OU dans une dimension, descendants inclus. Une dimension
// contrainte sans coordonnée (marginale « Tous ») est hors périmètre. Périmètre
// vide, ou dont aucun membre n'est rattachable à une dimension : fail-closed.
// L'API reste l'autorité ; ce calcul sert seulement à cacher l'écriture.
export const estDansPerimetre = ({
  perimetre,
  coordonnees,
  nodes,
  dimensions,
}: {
  perimetre: ReadonlyArray<string>
  coordonnees: ReadonlyArray<Coordonnee>
  nodes: ReadonlyArray<IndividuNode>
  dimensions: ReadonlyArray<DimensionCellule>
}): boolean => {
  const nodeById = new Map(nodes.map((node) => [node.individu.id, node] as const))
  const dimensionDe = dimensionParReferentiel(dimensions)
  const ancetresParDimension = new Map(
    coordonnees.map((c) => [c.dimension, ancetresOuSoi(c.individu, nodeById)] as const),
  )

  const membresParDimension = new Map<string, Set<string>>()
  for (const membre of perimetre) {
    const node = nodeById.get(membre)
    // Membre d'un niveau non déclaré : rattaché à la dimension de la
    // coordonnée dont il est un ancêtre, s'il y en a une.
    const dimension = node
      ? dimensionDe.get(node.individu.referentiel)
      : coordonnees.find((c) => ancetresParDimension.get(c.dimension)?.has(membre))?.dimension
    if (!dimension) continue
    const membres = membresParDimension.get(dimension) ?? new Set<string>()
    membres.add(membre)
    membresParDimension.set(dimension, membres)
  }
  if (membresParDimension.size === 0) return false

  return [...membresParDimension.entries()].every(([dimension, membres]) => {
    const ancetres = ancetresParDimension.get(dimension)
    return ancetres !== undefined && [...membres].some((membre) => ancetres.has(membre))
  })
}
