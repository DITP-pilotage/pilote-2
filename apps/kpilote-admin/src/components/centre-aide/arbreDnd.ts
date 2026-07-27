import type { ArticleCentreAideApiModel } from '@pilote/kpilote-shared/centreAide'

export type NoeudPlat = {
  id: string
  parentId: string | null
  depth: number
  type: 'GROUPE' | 'PAGE'
  article: ArticleCentreAideApiModel
}

const deplacer = <T>(liste: T[], de: number, vers: number): T[] => {
  const copie = [...liste]
  const [element] = copie.splice(de, 1)
  if (element !== undefined) copie.splice(vers, 0, element)
  return copie
}

// Aplati l'arbre en liste ordonnée (DFS), en masquant les enfants des groupes repliés.
export const aplatir = (
  articles: ArticleCentreAideApiModel[],
  replies: ReadonlySet<string>,
): NoeudPlat[] => {
  const enfantsDe = new Map<string | null, ArticleCentreAideApiModel[]>()
  for (const article of articles) {
    const liste = enfantsDe.get(article.parentId) ?? []
    liste.push(article)
    enfantsDe.set(article.parentId, liste)
  }
  for (const liste of enfantsDe.values()) liste.sort((a, b) => a.ordre - b.ordre)

  const sortie: NoeudPlat[] = []
  const parcourir = (parentId: string | null, depth: number): void => {
    for (const article of enfantsDe.get(parentId) ?? []) {
      sortie.push({
        id: article.id,
        parentId: article.parentId,
        depth,
        type: article.type,
        article,
      })
      if (!replies.has(article.id)) parcourir(article.id, depth + 1)
    }
  }
  parcourir(null, 0)
  return sortie
}

// Retire les descendants de `id` (utilisé pendant le drag : on déplace le sous-arbre en bloc).
export const retirerDescendants = (plat: NoeudPlat[], id: string): NoeudPlat[] => {
  const index = plat.findIndex((noeud) => noeud.id === id)
  if (index === -1) return plat
  const base = plat[index]?.depth ?? 0
  const aRetirer = new Set<string>()
  for (let i = index + 1; i < plat.length && (plat[i]?.depth ?? 0) > base; i++) {
    const noeud = plat[i]
    if (noeud) aRetirer.add(noeud.id)
  }
  return plat.filter((noeud) => !aRetirer.has(noeud.id))
}

export type Projection = { depth: number; parentId: string | null; index: number }

// Calcule où l'élément déplacé atterrit : profondeur (via le décalage horizontal),
// parent cible (uniquement un GROUPE ou la racine) et position parmi ses frères.
export const projeter = (
  plat: NoeudPlat[],
  activeId: string,
  overId: string,
  decalageX: number,
  indentation: number,
): Projection => {
  const indexOver = plat.findIndex((noeud) => noeud.id === overId)
  const indexActive = plat.findIndex((noeud) => noeud.id === activeId)
  const active = plat[indexActive]
  if (!active || indexOver === -1) return { depth: 0, parentId: null, index: 0 }

  const nouveaux = deplacer(plat, indexActive, indexOver)
  const precedent = nouveaux[indexOver - 1]
  const suivant = nouveaux[indexOver + 1]

  const profondeurDrag = Math.round(decalageX / indentation)
  const projetee = active.depth + profondeurDrag
  // Un parent ne peut être qu'un GROUPE : sous une PAGE, on reste au niveau frère.
  const maxDepth = precedent
    ? precedent.type === 'GROUPE'
      ? precedent.depth + 1
      : precedent.depth
    : 0
  const minDepth = suivant ? suivant.depth : 0
  const depth = Math.max(minDepth, Math.min(projetee, maxDepth))

  const parentId = ((): string | null => {
    if (depth === 0 || !precedent) return null
    if (depth === precedent.depth) return precedent.parentId
    if (depth > precedent.depth) return precedent.id
    const ancetre = nouveaux
      .slice(0, indexOver)
      .reverse()
      .find((noeud) => noeud.depth === depth)
    return ancetre?.parentId ?? null
  })()

  let index = 0
  for (let i = 0; i < indexOver; i++) {
    const noeud = nouveaux[i]
    if (!noeud || noeud.id === activeId) continue
    if (noeud.parentId === parentId) index++
  }

  return { depth, parentId, index }
}
