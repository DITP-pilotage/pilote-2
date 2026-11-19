import {
  ancestorsOf,
  type Arbre,
  type ArbreNode,
  depthFirst,
  formatValue,
  TOUS_ID,
} from '@/lib/axeArbre'
import { type Cellule } from '@/lib/axeSerie'

export type CelluleRef = { id: string; index: number }

export type TableurTone = 'active' | 'precedent' | 'dependent'

// Pendant une recherche, tout est déplié et seules les modalités trouvées restent.
export const tableurRowsOf = ({
  arbre,
  collapsed,
  visible,
}: {
  arbre: Arbre
  collapsed: ReadonlySet<string>
  visible: ReadonlySet<string> | null
}): ArbreNode[] =>
  depthFirst({
    arbre,
    id: TOUS_ID,
    isOpen: (id) => (visible ? true : !collapsed.has(id)),
  }).filter((node) => !visible || visible.has(node.id))

// Sur la période de la cellule active : ses enfants l'alimentent, ses ancêtres en dépendent.
export const buildToneOf = ({
  arbre,
  active,
}: {
  arbre: Arbre
  active: CelluleRef | null
}): ((ref: CelluleRef) => TableurTone | undefined) => {
  const activeNode = active ? arbre.get(active.id) : undefined
  const precedents = new Set(activeNode?.children ?? [])
  const dependents = new Set(
    activeNode ? ancestorsOf({ arbre, id: activeNode.id }).map((node) => node.id) : [],
  )
  return (ref) => {
    if (!active || ref.index !== active.index) return undefined
    if (ref.id === active.id) return 'active'
    if (precedents.has(ref.id)) return 'precedent'
    if (dependents.has(ref.id)) return 'dependent'
    return undefined
  }
}

export const placeholderOf = (cellule: Cellule | undefined): string => {
  if (!cellule) return ''
  if (cellule.statut === 'reportee' && cellule.value !== null) {
    return `↳ ${formatValue(cellule.value)}`
  }
  if (cellule.statut === 'manquante') return '?'
  if (cellule.statut === 'absente') return '·'
  return ''
}

export const lastSaisieBefore = ({
  saisies,
  index,
}: {
  saisies: ReadonlyArray<string> | undefined
  index: number
}): number | null => {
  for (let periode = index - 1; periode >= 0; periode--) {
    if (saisies?.[periode]?.trim()) return periode
  }
  return null
}

type ChildCellule = { node: ArbreNode; cellule: Cellule }

export type ChildrenExplanation = {
  terms: string[]
  missing: ChildCellule[]
  ignored: ChildCellule[]
  isEmpty: boolean
}

// Les enfants d'une parente sur une période : ceux qui comptent (avec leur valeur), ceux qui
// manquent, et ceux jamais saisis qui sortent du calcul.
export const explainChildren = ({
  arbre,
  node,
  index,
  serie,
}: {
  arbre: Arbre
  node: ArbreNode
  index: number
  serie: ReadonlyMap<string, ReadonlyArray<Cellule>>
}): ChildrenExplanation => {
  const children = node.children.flatMap((id) => {
    const child = arbre.get(id)
    const childCellule = serie.get(id)?.[index]
    return child && childCellule ? [{ node: child, cellule: childCellule }] : []
  })
  const counted = children.filter((child) => child.cellule.value !== null)
  const missing = children.filter(
    (child) => child.cellule.value === null && child.cellule.statut !== 'absente',
  )
  const ignored = children.filter((child) => child.cellule.statut === 'absente')
  const terms = counted.map((child) => {
    const reporteeSuffix = child.cellule.statut === 'reportee' ? ' (reportée)' : ''
    return `${child.node.nom} ${formatValue(child.cellule.value ?? 0)}${reporteeSuffix}`
  })
  return { terms, missing, ignored, isEmpty: counted.length === 0 && missing.length === 0 }
}
