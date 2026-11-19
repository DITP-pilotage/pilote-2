import { type FonctionAgregationAxe, type NiveauAxeApiModel } from '@pilote/kpilote-shared/axe'

import {
  type Arbre,
  ancestorsOf,
  type ArbreNode,
  countDescendants,
  fonctionLabel,
  nodesOfKind,
  normalize,
  pluralize,
  pluralSuffix,
  relatedIds,
  TOUS_ID,
} from '@/lib/axeArbre'

export const NODE_HEIGHT = 52
export const HEADER_HEIGHT = 64
const ROW_HEIGHT = 64
const LANE_PADDING = 16
const MIN_COLUMN_GAP = 48
const MAX_NODE_WIDTH = 240
const MIN_NODE_WIDTH = 150
export const CHILD_LIMIT = 25

export type PlacedNode = ArbreNode & { x: number; y: number; hidden: number }

// La boîte « + N autres modalités » d'une parente qui dépasse CHILD_LIMIT enfants.
export type MoreNode = { parent: string; x: number; y: number; count: number }

// Ce qu'on garde ouvert : les parentes repliées, et celles dont on affiche tous les enfants.
export type Display = { collapsed: ReadonlySet<string>; showAll: ReadonlySet<string> }

export type Selection =
  | { type: 'node'; id: string }
  | { type: 'niveau'; ordre: number }
  | { type: 'ajout'; parent: string | null }
  | null

export const selectedNodeIdOf = (selection: Selection): string | null => {
  if (selection?.type === 'node') return selection.id
  if (selection?.type === 'ajout') return selection.parent ?? TOUS_ID
  return null
}

export const highlightedIdsOf = ({
  arbre,
  focus,
  selection,
}: {
  arbre: Arbre
  focus: string | null
  selection: Selection
}): Set<string> | null => {
  if (focus) return relatedIds({ arbre, id: focus })
  if (selection?.type !== 'niveau') return null
  const membres = [...arbre.values()].filter((node) => node.niveau === selection.ordre)
  return new Set(membres.map((node) => node.id))
}

// Les modalités dont le nom ou l'identifiant contient la recherche, avec leurs ancêtres pour
// garder le chemin jusqu'à « Tous ». null : pas de recherche, tout est visible.
export const matchingIds = ({
  arbre,
  search,
}: {
  arbre: Arbre
  search: string
}): Set<string> | null => {
  const query = normalize(search.trim())
  if (query === '') return null
  const isMatch = (node: ArbreNode) =>
    normalize(node.nom).includes(query) || normalize(node.id).includes(query)
  const matches = [...arbre.values()].filter((node) => node.kind !== 'tous' && isMatch(node))
  return new Set([
    TOUS_ID,
    ...matches.flatMap((node) => [
      node.id,
      ...ancestorsOf({ arbre, id: node.id }).map((ancestor) => ancestor.id),
    ]),
  ])
}

// Déplie les ancêtres d'une modalité et lève la limite d'affichage là où elle la cache.
export const revealNode = ({
  arbre,
  id,
  display,
}: {
  arbre: Arbre
  id: string
  display: Display
}): Display => {
  const chain = ancestorsOf({ arbre, id })
  const chainIds = new Set(chain.map((ancestor) => ancestor.id))
  const showAll = new Set(display.showAll)
  let child = id
  for (const ancestor of chain) {
    if (ancestor.children.indexOf(child) >= CHILD_LIMIT) showAll.add(ancestor.id)
    child = ancestor.id
  }
  return {
    collapsed: new Set([...display.collapsed].filter((collapsedId) => !chainIds.has(collapsedId))),
    showAll,
  }
}

// Identifiant proposé à partir du nom, préfixé par celui du parent : « Orange » sous « OP »
// donne « OP-ORANGE ». Il respecte le format des identifiants de modalité.
export const suggestModaliteId = ({
  nom,
  parent,
}: {
  nom: string
  parent: string | null
}): string => {
  const slug = nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const prefix = parent && parent !== TOUS_ID ? `${parent.split('-')[0]}-` : ''
  return `${prefix}${slug}`
    .replace(/^[^A-Z]+/, '')
    .slice(0, 20)
    .replace(/-+$/, '')
}

const visibleChildren = ({
  node,
  isCollapsed,
  visible,
}: {
  node: ArbreNode
  isCollapsed: boolean
  visible: ReadonlySet<string> | null
}): string[] => {
  if (isCollapsed) return []
  if (visible) return node.children.filter((child) => visible.has(child))
  return node.children
}

export type GraphLayout = {
  placed: Map<string, PlacedNode>
  extras: MoreNode[]
  laneWidth: number
  nodeWidth: number
  laneX: (column: number) => number
  width: number
  height: number
}

// Une colonne par niveau, le plus fin à gauche et « Tous » à droite ; chaque parente est
// centrée verticalement sur ses enfants.
export const buildGraphLayout = ({
  arbre,
  depth,
  availableWidth,
  display,
  visible,
}: {
  arbre: Arbre
  depth: number
  availableWidth: number
  display: Display
  visible: ReadonlySet<string> | null
}): GraphLayout => {
  const columns = depth + 1
  const laneWidth = Math.max(MIN_NODE_WIDTH + MIN_COLUMN_GAP, availableWidth / columns)
  const nodeWidth = Math.max(MIN_NODE_WIDTH, Math.min(MAX_NODE_WIDTH, laneWidth - MIN_COLUMN_GAP))
  const laneX = (column: number) => column * laneWidth
  const nodeX = (column: number) => laneX(column) + (laneWidth - nodeWidth) / 2
  const columnOf = (niveau: number) => (niveau === 0 ? depth : depth - niveau)
  const placed = new Map<string, PlacedNode>()
  const extras: MoreNode[] = []
  let row = 0
  const nextRowY = () => HEADER_HEIGHT + LANE_PADDING + row++ * ROW_HEIGHT

  const place = (node: ArbreNode): number => {
    const isCollapsed = !visible && display.collapsed.has(node.id)
    const children = visibleChildren({ node, isCollapsed, visible })
    const isLimited = !visible && !display.showAll.has(node.id) && children.length > CHILD_LIMIT
    const shown = isLimited ? children.slice(0, CHILD_LIMIT) : children
    const childYs = shown.flatMap((childId) => {
      const child = arbre.get(childId)
      return child ? [place(child)] : []
    })
    if (isLimited) {
      const moreY = nextRowY()
      extras.push({
        parent: node.id,
        x: nodeX(columnOf(node.niveau + 1)),
        y: moreY,
        count: children.length - CHILD_LIMIT,
      })
      childYs.push(moreY)
    }
    const y =
      childYs.length === 0
        ? nextRowY()
        : childYs.reduce((total, childY) => total + childY, 0) / childYs.length
    placed.set(node.id, {
      ...node,
      x: nodeX(columnOf(node.niveau)),
      y,
      hidden: isCollapsed ? countDescendants({ arbre, id: node.id }) : 0,
    })
    return y
  }
  const tous = arbre.get(TOUS_ID)
  if (tous) place(tous)

  return {
    placed,
    extras,
    laneWidth,
    nodeWidth,
    laneX,
    width: laneWidth * columns,
    height:
      HEADER_HEIGHT + LANE_PADDING * 2 + Math.max(row, 1) * ROW_HEIGHT - (ROW_HEIGHT - NODE_HEIGHT),
  }
}

export const searchSummaryOf = (count: number): string => {
  if (count === 0) return 'Aucune modalité ne correspond.'
  const shown = `affichée${pluralSuffix(count)}`
  return `${pluralize({ count, word: 'modalité' })} ${shown} (résultats et leurs parents)`
}

export const WARNINGS_LIMIT = 5

export type AxeWarnings = {
  emptyNiveaux: NiveauAxeApiModel[]
  earlyFeuilles: ArbreNode[]
  singleChildParentes: ArbreNode[]
  count: number
  isTruncated: boolean
}

export const axeWarningsOf = ({
  arbre,
  niveaux,
}: {
  arbre: Arbre
  niveaux: ReadonlyArray<NiveauAxeApiModel>
}): AxeWarnings => {
  const nodes = [...arbre.values()]
  const emptyNiveaux = niveaux.filter(
    (niveau) => !nodes.some((node) => node.kind !== 'tous' && node.niveau === niveau.ordre),
  )
  const earlyFeuilles = nodesOfKind({ arbre, kind: 'feuille' }).filter(
    (feuille) => feuille.niveau < niveaux.length,
  )
  const singleChildParentes = nodesOfKind({ arbre, kind: 'parente' }).filter(
    (parente) => parente.children.length === 1,
  )
  return {
    emptyNiveaux,
    earlyFeuilles,
    singleChildParentes,
    count: emptyNiveaux.length + earlyFeuilles.length + singleChildParentes.length,
    isTruncated: earlyFeuilles.length + singleChildParentes.length > WARNINGS_LIMIT * 2,
  }
}

// Une colonne par niveau : le plus fin à gauche, « Tous » (ordre 0) dans la dernière.
export const lanesOf = (depth: number): Array<{ column: number; ordre: number }> =>
  Array.from({ length: depth + 1 }, (_, column) => ({
    column,
    ordre: column === depth ? 0 : depth - column,
  }))

export const edgesOf = (
  placed: ReadonlyMap<string, PlacedNode>,
): Array<{ node: PlacedNode; parent: PlacedNode }> =>
  [...placed.values()].flatMap((node) => {
    const parent = node.parent ? placed.get(node.parent) : undefined
    return parent ? [{ node, parent }] : []
  })

// Courbe de Bézier du bord droit d'un nœud vers le bord gauche de sa parente.
export const edgePathOf = ({
  from,
  to,
  nodeWidth,
}: {
  from: { x: number; y: number }
  to: { x: number; y: number }
  nodeWidth: number
}): string => {
  const startX = from.x + nodeWidth
  const startY = from.y + NODE_HEIGHT / 2
  const endX = to.x - 2
  const endY = to.y + NODE_HEIGHT / 2
  const midX = (startX + endX) / 2
  return `M${startX},${startY} C${midX},${startY} ${midX},${endY} ${endX},${endY}`
}

export const nodeMetaOf = ({
  node,
  isSimulating,
  fonction,
}: {
  node: PlacedNode
  isSimulating: boolean
  fonction: FonctionAgregationAxe
}): string => {
  if (node.kind === 'feuille') return 'Saisie'
  if (node.children.length === 0) return 'Aucune modalité'
  if (node.hidden > 0) {
    return `${pluralize({ count: node.hidden, word: 'modalité' })} repliée${pluralSuffix(node.hidden)}`
  }
  const operation = isSimulating ? fonctionLabel(fonction) : 'calcul'
  const children = pluralize({ count: node.children.length, word: 'enfant' })
  return `${operation.charAt(0).toUpperCase()}${operation.slice(1)} de ${children}`
}
