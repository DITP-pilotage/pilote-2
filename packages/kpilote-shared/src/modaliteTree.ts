import { groupBy } from 'es-toolkit'

// Racine artificielle de chaque axe : le reste du code parcourt un seul arbre.
export const TOUS_ID = '__TOUS__'

export type ModaliteKind = 'feuille' | 'parente' | 'tous'

export type ModaliteNode = {
  id: string
  nom: string
  kind: ModaliteKind
  // 0 pour « Tous », puis l'ordre du niveau de la modalité dans son axe.
  niveau: number
  parent: string | null
  children: ReadonlyArray<string>
}

export type ModaliteTree = ReadonlyMap<string, ModaliteNode>

type TreeModalite = { id: string; nom: string; niveau: number; parent: string | null }

export const buildModaliteTree = ({
  modalites,
  tousNom = 'Tous',
}: {
  modalites: ReadonlyArray<TreeModalite>
  tousNom?: string
}): ModaliteTree => {
  const enfantsByParent = groupBy(modalites, (modalite) => modalite.parent ?? TOUS_ID)
  const childrenOf = (id: string) => (enfantsByParent[id] ?? []).map((modalite) => modalite.id)
  const tree = new Map<string, ModaliteNode>()
  for (const modalite of modalites) {
    const children = childrenOf(modalite.id)
    tree.set(modalite.id, {
      id: modalite.id,
      nom: modalite.nom,
      kind: children.length === 0 ? 'feuille' : 'parente',
      niveau: modalite.niveau,
      parent: modalite.parent ?? TOUS_ID,
      children,
    })
  }
  tree.set(TOUS_ID, {
    id: TOUS_ID,
    nom: tousNom,
    kind: 'tous',
    niveau: 0,
    parent: null,
    children: childrenOf(TOUS_ID),
  })
  return tree
}

export const ancestorsOf = ({ tree, id }: { tree: ModaliteTree; id: string }): ModaliteNode[] => {
  const chain: ModaliteNode[] = []
  let parent = tree.get(id)?.parent ?? null
  while (parent) {
    const node = tree.get(parent)
    if (!node) break
    chain.push(node)
    parent = node.parent
  }
  return chain
}

export const descendantsOf = ({ tree, id }: { tree: ModaliteTree; id: string }): string[] =>
  (tree.get(id)?.children ?? []).flatMap((child) => [child, ...descendantsOf({ tree, id: child })])

// Ordre de lecture d'un tableau : chaque parente suivie de sa descendance dépliée.
export const depthFirst = ({
  tree,
  id = TOUS_ID,
  isOpen = () => true,
}: {
  tree: ModaliteTree
  id?: string
  isOpen?: (id: string) => boolean
}): ModaliteNode[] => {
  const node = tree.get(id)
  if (!node) return []
  const children = isOpen(id) ? node.children : []
  return [node, ...children.flatMap((child) => depthFirst({ tree, id: child, isOpen }))]
}

export const countFeuilles = (tree: ModaliteTree): number =>
  [...tree.values()].filter((node) => node.kind === 'feuille').length
