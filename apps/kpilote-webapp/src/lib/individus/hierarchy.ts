import { type IndividuApiModel } from '@pilote/kpilote-shared/individu'
import { type ReferentielApiModel } from '@pilote/kpilote-shared/referentiel'

export type IndividuNode = {
  individu: IndividuApiModel
  referentiel: ReferentielApiModel
  depth: number
  parentPath: ReadonlyArray<string>
}

export const buildOrderedNodes = (
  individus: ReadonlyArray<IndividuApiModel>,
  referentielsById: ReadonlyMap<string, ReferentielApiModel>,
): IndividuNode[] => {
  const byId = new Map(individus.map((i) => [i.id, i] as const))
  const childrenByParent = new Map<string | null, IndividuApiModel[]>()
  for (const individu of individus) {
    const parent = individu.parents.find((p) => byId.has(p)) ?? null
    const bucket = childrenByParent.get(parent) ?? []
    bucket.push(individu)
    childrenByParent.set(parent, bucket)
  }
  for (const bucket of childrenByParent.values()) {
    bucket.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
  }

  const ordered: IndividuNode[] = []
  const visit = (individu: IndividuApiModel, depth: number, parentPath: ReadonlyArray<string>) => {
    const referentiel = referentielsById.get(individu.referentiel)
    if (!referentiel) return
    ordered.push({ individu, referentiel, depth, parentPath })
    const children = childrenByParent.get(individu.id) ?? []
    const nextPath = [...parentPath, individu.nom]
    for (const child of children) visit(child, depth + 1, nextPath)
  }
  for (const root of childrenByParent.get(null) ?? []) visit(root, 0, [])
  return ordered
}

export const pickRoot = (nodes: ReadonlyArray<IndividuNode>): IndividuNode | null =>
  nodes.find((node) => node.depth === 0) ?? null

export type ReferentielGroup = {
  referentiel: ReferentielApiModel
  nodes: IndividuNode[]
}

// Regroupe les nœuds ordonnés (issus de buildOrderedNodes, ordre DFS) par
// référentiel *racine* : chaque arbre de la forêt est rattaché au référentiel de
// son individu racine (depth 0). Les descendants rattachés à d'autres
// référentiels (ex. régions/départements sous la France nationale) restent dans
// le groupe de leur racine, ce qui préserve la hiérarchie complète en étape 2.
export const groupNodesByRootReferentiel = (
  nodes: ReadonlyArray<IndividuNode>,
): ReferentielGroup[] => {
  const groups: ReferentielGroup[] = []
  const byReferentielId = new Map<string, ReferentielGroup>()
  let current: ReferentielGroup | null = null
  for (const node of nodes) {
    if (node.depth === 0) {
      current =
        byReferentielId.get(node.referentiel.id) ??
        (() => {
          const created: ReferentielGroup = { referentiel: node.referentiel, nodes: [] }
          byReferentielId.set(node.referentiel.id, created)
          groups.push(created)
          return created
        })()
    }
    current?.nodes.push(node)
  }
  return groups
}

// Renvoie l'id du référentiel *racine* du groupe contenant l'individu donné
// (utilisé pour ouvrir par défaut le bon collapsible dans le sélecteur), ou null
// si l'individu n'appartient à aucun groupe.
export const findRootReferentielIdForIndividu = (
  groups: ReadonlyArray<ReferentielGroup>,
  individuId: string,
): string | null =>
  groups.find((group) => group.nodes.some((node) => node.individu.id === individuId))?.referentiel
    .id ?? null
