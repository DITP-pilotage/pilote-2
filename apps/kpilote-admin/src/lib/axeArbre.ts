import { type ModaliteApiModel } from '@pilote/kpilote-shared/axe'
import { groupBy } from 'es-toolkit'

export const TOUS_ID = '__TOUS__'

export type Fonction = 'SUM' | 'AVG'
export type Kind = 'feuille' | 'parente' | 'tous'

export type ArbreNode = {
  id: string
  nom: string
  kind: Kind
  niveau: number
  parent: string | null
  children: string[]
}

export type Arbre = Map<string, ArbreNode>

// « Tous » est une racine artificielle : le reste du code parcourt un seul arbre.
export const buildArbre = (modalites: ReadonlyArray<ModaliteApiModel>): Arbre => {
  const enfantsByParent = groupBy(modalites, (modalite) => modalite.parent ?? TOUS_ID)
  const childrenOf = (id: string) => (enfantsByParent[id] ?? []).map((modalite) => modalite.id)
  const arbre: Arbre = new Map()
  for (const modalite of modalites) {
    const children = childrenOf(modalite.id)
    arbre.set(modalite.id, {
      id: modalite.id,
      nom: modalite.nom,
      kind: children.length === 0 ? 'feuille' : 'parente',
      niveau: modalite.niveau,
      parent: modalite.parent ?? TOUS_ID,
      children,
    })
  }
  arbre.set(TOUS_ID, {
    id: TOUS_ID,
    nom: 'Tous',
    kind: 'tous',
    niveau: 0,
    parent: null,
    children: childrenOf(TOUS_ID),
  })
  return arbre
}

export const countDescendants = ({ arbre, id }: { arbre: Arbre; id: string }): number =>
  (arbre.get(id)?.children ?? []).reduce(
    (total, child) => total + 1 + countDescendants({ arbre, id: child }),
    0,
  )

export const ancestorsOf = ({ arbre, id }: { arbre: Arbre; id: string }): ArbreNode[] => {
  const chain: ArbreNode[] = []
  let parent = arbre.get(id)?.parent ?? null
  while (parent) {
    const node = arbre.get(parent)
    if (!node) break
    chain.push(node)
    parent = node.parent
  }
  return chain
}

export const descendantsOf = ({ arbre, id }: { arbre: Arbre; id: string }): string[] =>
  (arbre.get(id)?.children ?? []).flatMap((child) => [
    child,
    ...descendantsOf({ arbre, id: child }),
  ])

// Une modalité, sa descendance (ce qui l'alimente) et ses ancêtres (ce qu'elle alimente).
export const relatedIds = ({ arbre, id }: { arbre: Arbre; id: string }): Set<string> =>
  new Set([
    id,
    ...descendantsOf({ arbre, id }),
    ...ancestorsOf({ arbre, id }).map((node) => node.id),
  ])

// Ordre de lecture d'un tableau : chaque parente suivie de sa descendance.
export const depthFirst = ({
  arbre,
  id,
  isOpen,
}: {
  arbre: Arbre
  id: string
  isOpen: (id: string) => boolean
}): ArbreNode[] => {
  const node = arbre.get(id)
  if (!node) return []
  const children = isOpen(id) ? node.children : []
  return [node, ...children.flatMap((child) => depthFirst({ arbre, id: child, isOpen }))]
}

export const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export const formatValue = (value: number) =>
  value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })

export const pluriel = ({ count, mot }: { count: number; mot: string }) =>
  `${count} ${mot}${count > 1 ? 's' : ''}`

export const fonctionLabel = (fonction: Fonction) => (fonction === 'SUM' ? 'somme' : 'moyenne')

// « Tous » est la marginale d'un axe : avec plusieurs axes, son nom doit dire lequel.
export const nommerTous = ({ arbre, axeNom }: { arbre: Arbre; axeNom: string }): Arbre => {
  const tous = arbre.get(TOUS_ID)
  if (!tous) return arbre
  return new Map(arbre).set(TOUS_ID, { ...tous, nom: `Tous (${axeNom})` })
}
