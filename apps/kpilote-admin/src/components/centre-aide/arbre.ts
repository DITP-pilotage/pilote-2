import type { ArticleCentreAideApiModel } from '@pilote/kpilote-shared/centreAide'

export type NoeudArbre = ArticleCentreAideApiModel & { enfants: NoeudArbre[] }

// Reconstruit l'arbre depuis la liste plate (triée par l'API : parent puis ordre).
// Les articles dont le parent est absent de la liste sont rattachés à la racine.
export const construireArbre = (articles: ArticleCentreAideApiModel[]): NoeudArbre[] => {
  const parId = new Map<string, NoeudArbre>()
  for (const article of articles) parId.set(article.id, { ...article, enfants: [] })

  const racine: NoeudArbre[] = []
  for (const article of articles) {
    const noeud = parId.get(article.id)
    if (!noeud) continue
    const parent = article.parentId ? parId.get(article.parentId) : undefined
    if (parent) parent.enfants.push(noeud)
    else racine.push(noeud)
  }

  const trierParOrdre = (noeuds: NoeudArbre[]): void => {
    noeuds.sort((a, b) => a.ordre - b.ordre)
    for (const noeud of noeuds) trierParOrdre(noeud.enfants)
  }
  trierParOrdre(racine)
  return racine
}

// Un article a des changements non publiés si son brouillon diverge du publié
// (ou s'il n'a jamais été publié tout en ayant du contenu brouillon).
export const aDesModificationsNonPubliees = (article: ArticleCentreAideApiModel): boolean =>
  !article.estPublie ||
  article.titreBrouillon !== article.titre ||
  article.titreAfficheBrouillon !== article.titreAffiche ||
  article.contenuBrouillon !== article.contenu
