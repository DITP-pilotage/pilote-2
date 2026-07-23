import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { RenduContenuCentreAide } from '@pilote/kpilote-ui/centre-aide'
import { Heading, Text } from '@pilote/kpilote-ui/Typography'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { clsxm } from '@/lib/clsxm'
import { useRecordVisit } from '@/lib/recentlyVisited'
import { articlesCentreAidePubliesQueryOptions } from '@/queries/centreAide'

export const Route = createFileRoute('/_authenticated/centre-aide/')({
  validateSearch: (search: Record<string, unknown>): { article: string | undefined } => ({
    article: typeof search.article === 'string' ? search.article : undefined,
  }),
  component: CentreAidePage,
})

function CentreAidePage() {
  // Le param d'URL `article` est la source de vérité : deep-links, cmd+K et clics
  // de la sidebar passent tous par lui, donc la page reste synchro même quand on
  // change d'article sans remonter le composant.
  const { article: articleParam } = Route.useSearch()
  const navigate = useNavigate()
  const { data: articles, isPending, isError } = useQuery(articlesCentreAidePubliesQueryOptions())

  const selectionner = (id: string) =>
    void navigate({ to: '/centre-aide', search: { article: id } })

  if (isPending) return <Text tone="muted">Chargement…</Text>
  if (isError) return <Text tone="muted">Le centre d’aide est momentanément indisponible.</Text>

  const pages = articles.filter((article) => article.type === 'PAGE')
  const selectionne = articles.find((article) => article.id === articleParam) ?? pages[0] ?? null

  if (articles.length === 0) {
    return (
      <div>
        <Heading>Centre d’aide</Heading>
        <Text tone="muted">Aucun article n’est publié pour le moment.</Text>
      </div>
    )
  }

  return (
    <div className="flex gap-10">
      <nav className="w-64 shrink-0">
        <NavCentreAide
          articles={articles}
          selectedId={selectionne?.id ?? null}
          onSelect={selectionner}
        />
      </nav>

      <article className="min-w-0 max-w-3xl flex-1">
        {selectionne ? (
          <ContenuArticle article={selectionne} />
        ) : (
          <Text tone="muted">Sélectionnez un article.</Text>
        )}
      </article>
    </div>
  )
}

const INDENTATION_NAV = 16

type ArticlePublic = {
  id: string
  type: 'GROUPE' | 'PAGE'
  parentId: string | null
  ordre: number
  titre: string
  titreAffiche: string
}

type NoeudNav = { article: ArticlePublic; depth: number }

const aplatirNav = (articles: ArticlePublic[], replies: ReadonlySet<string>): NoeudNav[] => {
  const enfantsDe = new Map<string | null, ArticlePublic[]>()
  for (const article of articles) {
    const liste = enfantsDe.get(article.parentId) ?? []
    liste.push(article)
    enfantsDe.set(article.parentId, liste)
  }
  for (const liste of enfantsDe.values()) liste.sort((a, b) => a.ordre - b.ordre)

  const sortie: NoeudNav[] = []
  const parcourir = (parentId: string | null, depth: number): void => {
    for (const article of enfantsDe.get(parentId) ?? []) {
      sortie.push({ article, depth })
      if (!replies.has(article.id)) parcourir(article.id, depth + 1)
    }
  }
  parcourir(null, 0)
  return sortie
}

// Arborescence de lecture : lignes de guidage + repli des groupes, alignée sur le
// design de l'éditeur admin (lecture seule, sans drag).
function NavCentreAide({
  articles,
  selectedId,
  onSelect,
}: {
  articles: ArticlePublic[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const [replies, setReplies] = useState<ReadonlySet<string>>(new Set())
  const noeuds = aplatirNav(articles, replies)
  const aDesEnfants = (id: string) => articles.some((article) => article.parentId === id)

  const basculer = (id: string) =>
    setReplies((precedent) => {
      const suivant = new Set(precedent)
      if (suivant.has(id)) suivant.delete(id)
      else suivant.add(id)
      return suivant
    })

  return (
    <ul className="select-none text-sm">
      {noeuds.map(({ article, depth }) => {
        const estGroupe = article.type === 'GROUPE'
        const titre = article.titreAffiche || article.titre
        const replie = replies.has(article.id)
        return (
          <li key={article.id}>
            <div
              onClick={() => (estGroupe ? basculer(article.id) : onSelect(article.id))}
              style={{ paddingLeft: depth * INDENTATION_NAV + 6 }}
              className={clsxm(
                'relative flex cursor-pointer items-center gap-1 rounded-md py-1.5 pr-2',
                !estGroupe && selectedId === article.id
                  ? 'bg-primary-tinted font-medium text-primary'
                  : estGroupe
                    ? 'font-semibold text-text hover:bg-surface-tinted'
                    : 'text-text-muted hover:bg-surface-tinted hover:text-text',
              )}
            >
              {Array.from({ length: depth }).map((_, niveau) => (
                <span
                  key={niveau}
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 border-l border-border"
                  style={{ left: niveau * INDENTATION_NAV + 13 }}
                />
              ))}
              {estGroupe && aDesEnfants(article.id) ? (
                <span className="flex text-text-subtle">
                  {replie ? (
                    <ChevronRight className="size-3.5" />
                  ) : (
                    <ChevronDown className="size-3.5" />
                  )}
                </span>
              ) : (
                <span className="w-3.5 shrink-0" />
              )}
              <span className="flex-1 truncate">{titre}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function ContenuArticle({
  article,
}: {
  article: { id: string; titre: string; titreAffiche: string; contenu: string }
}) {
  const titre = article.titreAffiche || article.titre
  useRecordVisit({ type: 'article', id: article.id, label: titre })
  return (
    <>
      <Heading className="mb-4">{titre}</Heading>
      <RenduContenuCentreAide html={article.contenu} />
    </>
  )
}
