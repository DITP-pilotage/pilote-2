import { useSuspenseQuery } from '@tanstack/react-query'
import {
  createFileRoute,
  Link,
  useNavigate,
} from '@tanstack/react-router'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
import { RouteError } from '@/components/RouteError'
import { RouteLoading } from '@/components/RouteLoading'
import { indicateursQueryOptions } from '@/queries/indicateurs'

const indicateursSearchSchema = z.object({
  recherche: z.string().optional(),
  cursor: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/indicateurs/')({
  validateSearch: indicateursSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.fetchQuery(indicateursQueryOptions(deps)),
  pendingComponent: () => <RouteLoading message="Chargement des indicateurs…" />,
  errorComponent: RouteError,
  component: IndicateursListComponent,
})

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  month: '2-digit',
  year: 'numeric',
})

function formatMiseAJour(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return dateFormatter.format(date)
}

function IndicateursListComponent() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data } = useSuspenseQuery(indicateursQueryOptions(search))

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-text">Liste des indicateurs</h1>
        <p className="text-sm text-text-muted">
          Consultez et gérez l&apos;ensemble de vos indicateurs.
        </p>
      </header>

      <section className="space-y-6 rounded-lg border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-muted">
            {data.total} indicateur{data.total > 1 ? 's' : ''}
          </p>
          <input
            type="search"
            placeholder="Rechercher par nom…"
            value={search.recherche ?? ''}
            onChange={(e) => {
              const recherche = e.target.value || undefined
              void navigate({ search: (prev) => ({ ...prev, recherche, cursor: undefined }) })
            }}
            className="w-full max-w-xs rounded-md border border-secondary-border bg-surface px-3 py-1.5 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {data.items.length === 0 ? (
          <p className="py-12 text-center text-sm text-text-muted">
            Aucun indicateur ne correspond aux filtres.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((indicateur) => (
              <li key={indicateur.id}>
                <Link
                  to="/indicateurs/$id"
                  params={{ id: indicateur.id }}
                  className="group flex h-full flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-secondary-border hover:bg-secondary-hover"
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
                    {indicateur.id}
                  </span>
                  <h2 className="text-base font-semibold text-text group-hover:text-primary">
                    {indicateur.nom}
                  </h2>
                  <p className="mt-auto text-xs text-text-muted">
                    Mise à jour : {formatMiseAJour(indicateur.updatedAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {data.pagination.hasMore && data.pagination.cursor && (
          <div className="flex justify-center">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => {
                const next = data.pagination.cursor
                if (next) void navigate({ search: (prev) => ({ ...prev, cursor: next }) })
              }}
            >
              Page suivante
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
