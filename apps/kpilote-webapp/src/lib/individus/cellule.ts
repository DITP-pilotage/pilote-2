import { formatCelluleId } from '@pilote/kpilote-shared/cellule'
import { type ConfigurationIndicateurDimensionApiModel } from '@pilote/kpilote-shared/indicateur'

import { type IndividuNode } from '@/lib/individus/hierarchy'

// Cellule courante d'un indicateur multi-dimension, telle que la fiche la porte
// dans l'URL. Cf. apps/kpilote-api/docs/architecture/dimensions-design.md §5.2.
//
// Forme d'URL : `individu` + `referentiel` portent la coordonnée de la première
// dimension présente (dans l'ordre des dimensions — la principale quand elle est
// fixée), `autres` les coordonnées suivantes (CSV de publicIds, dans l'ordre des
// dimensions). Une dimension absente vaut « Tous » (marginale). Un lien profond
// historique `?individu=…&referentiel=…` reste donc valide tel quel : c'est la
// marginale « tous » sur les autres dimensions.

export type DimensionCellule = Pick<
  ConfigurationIndicateurDimensionApiModel,
  'id' | 'nom' | 'ordre' | 'fonctionAgregation' | 'referentiels'
>

export type Coordonnee = {
  dimension: string
  individu: string
  referentiel: string
}

export type SelectionCelluleUrl = {
  individu: string
  referentiel: string
  autres: string | undefined
}

export type CelluleCourante = {
  // Identifiant envoyé à l'API (membres joints par `~`, ordre des dimensions).
  id: string
  // Coordonnées présentes, triées dans l'ordre des dimensions.
  coordonnees: ReadonlyArray<Coordonnee>
}

export type CelluleResolution =
  | { kind: 'no-hierarchy' }
  | { kind: 'valid'; cellule: CelluleCourante }
  | { kind: 'mismatch'; fallback: SelectionCelluleUrl }

const SEPARATEUR_AUTRES = ','

export const estMultiDimension = (dimensions: ReadonlyArray<DimensionCellule>): boolean =>
  dimensions.length > 1

export const parseAutres = (raw: string | undefined): string[] =>
  raw
    ? raw
        .split(SEPARATEUR_AUTRES)
        .map((segment) => segment.trim())
        .filter((segment) => segment.length > 0)
    : []

export const formatAutres = (membres: ReadonlyArray<string>): string | undefined =>
  membres.length > 0 ? membres.join(SEPARATEUR_AUTRES) : undefined

const trierDimensions = (dimensions: ReadonlyArray<DimensionCellule>): DimensionCellule[] =>
  [...dimensions].sort((a, b) => a.ordre - b.ordre)

export const dimensionParReferentiel = (
  dimensions: ReadonlyArray<DimensionCellule>,
): ReadonlyMap<string, string> =>
  new Map(
    dimensions.flatMap((dimension) =>
      dimension.referentiels.map((referentiel) => [referentiel, dimension.id] as const),
    ),
  )

export const ordonnerCoordonnees = ({
  coordonnees,
  dimensions,
}: {
  coordonnees: ReadonlyArray<Coordonnee>
  dimensions: ReadonlyArray<DimensionCellule>
}): Coordonnee[] =>
  trierDimensions(dimensions).flatMap(
    (dimension) => coordonnees.find((c) => c.dimension === dimension.id) ?? [],
  )

export const celluleIdDepuisCoordonnees = ({
  coordonnees,
  dimensions,
}: {
  coordonnees: ReadonlyArray<Coordonnee>
  dimensions: ReadonlyArray<DimensionCellule>
}): string =>
  formatCelluleId(ordonnerCoordonnees({ coordonnees, dimensions }).map((c) => c.individu))

// Forme canonique d'URL d'un jeu de coordonnées ; null si aucune coordonnée
// (une cellule a au moins un membre).
export const selectionDepuisCoordonnees = ({
  coordonnees,
  dimensions,
}: {
  coordonnees: ReadonlyArray<Coordonnee>
  dimensions: ReadonlyArray<DimensionCellule>
}): SelectionCelluleUrl | null => {
  const [premiere, ...suivantes] = ordonnerCoordonnees({ coordonnees, dimensions })
  if (!premiere) return null
  return {
    individu: premiere.individu,
    referentiel: premiere.referentiel,
    autres: formatAutres(suivantes.map((c) => c.individu)),
  }
}

// Remplace (ou retire, `coordonnee: null` = « Tous ») la coordonnée d'une
// dimension. null si le retrait viderait la cellule.
export const remplacerCoordonnee = ({
  coordonnees,
  dimensions,
  dimension,
  coordonnee,
}: {
  coordonnees: ReadonlyArray<Coordonnee>
  dimensions: ReadonlyArray<DimensionCellule>
  dimension: string
  coordonnee: Coordonnee | null
}): SelectionCelluleUrl | null =>
  selectionDepuisCoordonnees({
    coordonnees: [
      ...coordonnees.filter((c) => c.dimension !== dimension),
      ...(coordonnee ? [coordonnee] : []),
    ],
    dimensions,
  })

const coordonneeDepuisNode = (
  node: IndividuNode,
  dimensionDe: ReadonlyMap<string, string>,
): Coordonnee | null => {
  const dimension = dimensionDe.get(node.individu.referentiel)
  return dimension
    ? { dimension, individu: node.individu.id, referentiel: node.individu.referentiel }
    : null
}

// Cellule par défaut : chaque dimension dont la hiérarchie a une racine unique
// (ex. France) y est fixée, les autres restent « Tous » — soit, sur Territoire ×
// Opérateur, la marginale « France, tous opérateurs ». À défaut (aucune racine
// unique), première racine de la dimension principale.
const coordonneesParDefaut = ({
  nodes,
  dimensions,
  dimensionDe,
}: {
  nodes: ReadonlyArray<IndividuNode>
  dimensions: ReadonlyArray<DimensionCellule>
  dimensionDe: ReadonlyMap<string, string>
}): Coordonnee[] => {
  const racinesDe = (dimensionId: string) =>
    nodes.filter(
      (node) => node.depth === 0 && dimensionDe.get(node.individu.referentiel) === dimensionId,
    )
  const uniques = trierDimensions(dimensions).flatMap((dimension) => {
    const racines = racinesDe(dimension.id)
    const racine = racines.length === 1 ? racines[0] : undefined
    const coordonnee = racine ? coordonneeDepuisNode(racine, dimensionDe) : null
    return coordonnee ? [coordonnee] : []
  })
  if (uniques.length > 0) return uniques
  for (const dimension of trierDimensions(dimensions)) {
    const racine = racinesDe(dimension.id)[0]
    const coordonnee = racine ? coordonneeDepuisNode(racine, dimensionDe) : null
    if (coordonnee) return [coordonnee]
  }
  const premier = nodes[0]
  const coordonnee = premier ? coordonneeDepuisNode(premier, dimensionDe) : null
  return coordonnee ? [coordonnee] : []
}

const memeSelection = (
  a: SelectionCelluleUrl,
  b: {
    individu?: string | undefined
    referentiel?: string | undefined
    autres?: string | undefined
  },
): boolean => a.individu === b.individu && a.referentiel === b.referentiel && a.autres === b.autres

// Résout la cellule courante depuis l'URL d'un indicateur multi-dimension.
// Les membres inconnus (ou d'une dimension déjà fixée) sont écartés ; si la
// forme d'URL n'est pas canonique, renvoie le fallback vers lequel rediriger.
export const resolveCelluleDepuisUrl = ({
  nodes,
  dimensions,
  search,
}: {
  nodes: ReadonlyArray<IndividuNode>
  dimensions: ReadonlyArray<DimensionCellule>
  search: {
    individu?: string | undefined
    referentiel?: string | undefined
    autres?: string | undefined
  }
}): CelluleResolution => {
  if (nodes.length === 0) return { kind: 'no-hierarchy' }
  const dimensionDe = dimensionParReferentiel(dimensions)
  const nodeById = new Map(nodes.map((node) => [node.individu.id, node] as const))

  const demandes = [...(search.individu ? [search.individu] : []), ...parseAutres(search.autres)]
  const parDimension = new Map<string, Coordonnee>()
  for (const membre of demandes) {
    const node = nodeById.get(membre)
    const coordonnee = node ? coordonneeDepuisNode(node, dimensionDe) : null
    if (!coordonnee || parDimension.has(coordonnee.dimension)) continue
    parDimension.set(coordonnee.dimension, coordonnee)
  }

  const coordonnees =
    parDimension.size > 0
      ? [...parDimension.values()]
      : coordonneesParDefaut({ nodes, dimensions, dimensionDe })
  const selection = selectionDepuisCoordonnees({ coordonnees, dimensions })
  if (!selection) return { kind: 'no-hierarchy' }
  if (!memeSelection(selection, search)) return { kind: 'mismatch', fallback: selection }
  return {
    kind: 'valid',
    cellule: {
      id: celluleIdDepuisCoordonnees({ coordonnees, dimensions }),
      coordonnees: ordonnerCoordonnees({ coordonnees, dimensions }),
    },
  }
}
