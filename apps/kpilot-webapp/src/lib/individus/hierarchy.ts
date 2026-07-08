import { type IndividuApiModel } from '@pilote/kpilot-shared/individu'
import { type ReferentielApiModel } from '@pilote/kpilot-shared/referentiel'

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
