import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { RenduContenuCentreAide } from '@pilote/kpilote-ui/centre-aide'
import { Heading, Text } from '@pilote/kpilote-ui/Typography'
import { useState } from 'react'

import { clsxm } from '@/lib/clsxm'
import { articlesCentreAidePubliesQueryOptions } from '@/queries/centreAide'

export const Route = createFileRoute('/_authenticated/centre-aide/')({
  validateSearch: (search: Record<string, unknown>): { article: string | undefined } => ({
    article: typeof search.article === 'string' ? search.article : undefined,
  }),
  component: CentreAidePage,
})

function CentreAidePage() {
  const { article: articleParam } = Route.useSearch()
  const { data: articles, isPending, isError } = useQuery(articlesCentreAidePubliesQueryOptions())
  const [selectedId, setSelectedId] = useState<string | null>(articleParam ?? null)

  if (isPending) return <Text tone="muted">Chargement…</Text>
  if (isError) return <Text tone="muted">Le centre d’aide est momentanément indisponible.</Text>

  const pages = articles.filter((article) => article.type === 'PAGE')
  const selectionne = articles.find((article) => article.id === selectedId) ?? pages[0] ?? null

  if (articles.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Heading>Centre d’aide</Heading>
        <Text tone="muted">Aucun article n’est publié pour le moment.</Text>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-6xl gap-10 px-6 py-10">
      <nav className="w-64 shrink-0">
        <ul className="space-y-0.5 text-sm">
          {articles.map((article) =>
            article.type === 'GROUPE' ? (
              <li
                key={article.id}
                className="px-2 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-text-subtle"
              >
                {article.titreAffiche || article.titre}
              </li>
            ) : (
              <li key={article.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(article.id)}
                  className={clsxm(
                    'w-full truncate rounded px-2 py-1.5 text-left transition-colors',
                    selectionne?.id === article.id
                      ? 'bg-primary-tinted font-medium text-primary'
                      : 'text-text-muted hover:bg-surface-tinted hover:text-text',
                  )}
                >
                  {article.titreAffiche || article.titre}
                </button>
              </li>
            ),
          )}
        </ul>
      </nav>

      <article className="min-w-0 max-w-3xl flex-1">
        {selectionne ? (
          <>
            <Heading className="mb-4">{selectionne.titreAffiche || selectionne.titre}</Heading>
            <RenduContenuCentreAide html={selectionne.contenu} />
          </>
        ) : (
          <Text tone="muted">Sélectionnez un article.</Text>
        )}
      </article>
    </div>
  )
}
