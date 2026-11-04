import { textFromHtml } from '@/assistant/tools/textFromHtml'
import { listerArticlesCentreAidePublies } from '@/centreAide/queries/listerArticlesPublies'

export type HelpPage = {
  id: string
  titre: string
  /** Titres des rubriques qui contiennent la page, de la racine vers elle. */
  chemin: string[]
  intertitres: string[]
  contenu: string
  url: string
}

const HEADING = /<h[1-6][^<>]*>(.*?)<\/h[1-6]>/gisu

const headingsOf = (html: string): string[] => [
  ...new Set(
    [...html.matchAll(HEADING)]
      .map((match) => textFromHtml(match[1] ?? ''))
      .filter((heading) => heading.length > 0),
  ),
]

/**
 * Les pages du centre d'aide telles que la page publique les montre (publiées, sous des
 * rubriques visibles), lues en base à chaque appel : une mise à jour compte aussitôt.
 */
export const listHelpPages = async (): Promise<HelpPage[]> => {
  const articles = await listerArticlesCentreAidePublies().unwrapOr([])
  const byId = new Map(articles.map((article) => [article.id, article]))
  const titleOf = (article: { titre: string; titreAffiche: string }) =>
    article.titreAffiche || article.titre

  const pathOf = (parentId: string | null): string[] => {
    const path: string[] = []
    for (let current = parentId; current; current = byId.get(current)?.parentId ?? null) {
      const parent = byId.get(current)
      if (parent) path.unshift(titleOf(parent))
    }
    return path
  }

  return articles
    .filter((article) => article.type === 'PAGE')
    .map((article) => ({
      id: article.id,
      titre: titleOf(article),
      chemin: pathOf(article.parentId),
      intertitres: headingsOf(article.contenu),
      contenu: textFromHtml(article.contenu),
      url: `/centre-aide?article=${article.id}`,
    }))
}
