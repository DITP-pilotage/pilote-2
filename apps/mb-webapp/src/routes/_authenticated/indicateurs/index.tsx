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

function IndicateursListComponent() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data } = useSuspenseQuery(indicateursQueryOptions(search))

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Indicateurs</h1>
      </header>

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Rechercher par nom…"
          value={search.recherche ?? ''}
          onChange={(e) => {
            const recherche = e.target.value || undefined
            void navigate({ search: (prev) => ({ ...prev, recherche, cursor: undefined }) })
          }}
          className="rounded border border-secondary-border px-3 py-1 text-sm"
        />
      </div>

      <ul className="divide-y divide-border rounded border border-border bg-surface">
        {data.items.map((indicateur) => (
          <li key={indicateur.id}>
            <Link
              to="/indicateurs/$id"
              params={{ id: indicateur.id }}
              className="block px-4 py-3 hover:bg-secondary-hover"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-medium text-text">{indicateur.nom}</span>
                <span className="text-xs uppercase tracking-wide text-text-muted">
                  {indicateur.id}
                </span>
              </div>
            </Link>
          </li>
        ))}
        {data.items.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-text-muted">
            Aucun indicateur ne correspond aux filtres.
          </li>
        )}
      </ul>

      {data.pagination.hasMore && data.pagination.cursor && (
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
      )}

      <section className="rounded border border-border bg-slate-100 p-4 text-sm">
        <p className="font-medium">Diagnostic TanStack Router</p>
        <ul className="mt-2 list-inside list-disc text-secondary-foreground">
          <li>✓ Loader exécuté ({data.total} indicateur(s) chargés)</li>
          <li>
            Search params parsés : <code>{JSON.stringify(search)}</code>
          </li>
          <li>✓ useSuspenseQuery branché</li>
          <li>🔒 Guard _authenticated franchi</li>
        </ul>
      </section>
    </div>
  )
}
