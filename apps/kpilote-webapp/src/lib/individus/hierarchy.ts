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

// Ne conserve que les ensembles (groupes par référentiel racine) dont l'arbre
// contient au moins un des référentiels voulus — typiquement ceux pertinents
// pour la page (indicateurs accessibles / du panier / de l'indicateur consulté).
export const filterGroupsForReferentiels = (
  groups: ReadonlyArray<ReferentielGroup>,
  referentielPublicIds: ReadonlyArray<string>,
): ReferentielGroup[] => {
  const wanted = new Set(referentielPublicIds)
  return groups.filter((group) => group.nodes.some((n) => wanted.has(n.referentiel.id)))
}

// Résout l'individu à observer pour une carte indicateur, à partir de la
// sélection par ensemble (référentiel racine → individu). On ignore un individu
// sélectionné dont le référentiel n'est pas associé à l'indicateur et on retombe
// alors sur le premier individu applicable de l'ensemble (défaut).
export const resolveIndividuForIndicateur = ({
  indicateurReferentielIds,
  selectedByRoot,
  groups,
}: {
  indicateurReferentielIds: ReadonlyArray<string>
  selectedByRoot: ReadonlyMap<string, string>
  groups: ReadonlyArray<ReferentielGroup>
}): IndividuNode | null => {
  const wanted = new Set(indicateurReferentielIds)
  const group = groups.find((g) => g.nodes.some((n) => wanted.has(n.referentiel.id)))
  if (!group) return null

  const selectedIndividuId = selectedByRoot.get(group.referentiel.id)
  if (selectedIndividuId) {
    const selected = group.nodes.find((n) => n.individu.id === selectedIndividuId)
    if (selected && wanted.has(selected.referentiel.id)) return selected
  }
  return group.nodes.find((n) => wanted.has(n.referentiel.id)) ?? null
}
