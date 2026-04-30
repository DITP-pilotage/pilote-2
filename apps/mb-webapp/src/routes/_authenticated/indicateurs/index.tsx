import { useSuspenseQuery } from '@tanstack/react-query'
import {
  createFileRoute,
  type ErrorComponentProps,
  Link,
  useNavigate,
} from '@tanstack/react-router'
import { z } from 'zod'

import { indicateursQueryOptions } from '@/queries/indicateurs'

const indicateursSearchSchema = z.object({
  recherche: z.string().optional(),
  statut: z.enum(['actif', 'inactif', 'archive']).optional(),
  cursor: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/indicateurs/')({
  validateSearch: indicateursSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(indicateursQueryOptions(deps)),
  pendingComponent: () => (
    <div className="rounded border border-slate-200 bg-white p-6 text-slate-500">
      Chargement des indicateurs…
    </div>
  ),
  errorComponent: ({ error, reset }: ErrorComponentProps) => (
    <div className="rounded border border-red-200 bg-red-50 p-6 text-red-800">
      <p className="font-medium">Erreur lors du chargement</p>
      <p className="mt-1 text-sm">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-3 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
      >
        Réessayer
      </button>
    </div>
  ),
  component: IndicateursListComponent,
})

function IndicateursListComponent() {
  const { auth } = Route.useRouteContext()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data } = useSuspenseQuery(indicateursQueryOptions(search))

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Indicateurs</h1>
        <span className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-800">
          🔒 Authentifié comme {auth.user?.name}
        </span>
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
          className="rounded border border-slate-300 px-3 py-1 text-sm"
        />
        <select
          value={search.statut ?? ''}
          onChange={(e) => {
            const value = e.target.value
            const statut =
              value === 'actif' || value === 'inactif' || value === 'archive'
                ? value
                : undefined
            void navigate({ search: (prev) => ({ ...prev, statut, cursor: undefined }) })
          }}
          className="rounded border border-slate-300 px-3 py-1 text-sm"
        >
          <option value="">Tous statuts</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
          <option value="archive">Archivé</option>
        </select>
      </div>

      <ul className="divide-y divide-slate-200 rounded border border-slate-200 bg-white">
        {data.items.map((indicateur) => (
          <li key={indicateur.id}>
            <Link
              to="/indicateurs/$id"
              params={{ id: indicateur.id }}
              className="block px-4 py-3 hover:bg-slate-50"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-medium text-slate-900">{indicateur.nom}</span>
                <span className="text-sm text-slate-500">
                  {indicateur.valeur} {indicateur.unite}
                </span>
              </div>
              <span className="text-xs uppercase tracking-wide text-slate-500">
                {indicateur.statut}
              </span>
            </Link>
          </li>
        ))}
        {data.items.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-500">
            Aucun indicateur ne correspond aux filtres.
          </li>
        )}
      </ul>

      {data.pagination.hasMore && data.pagination.cursor && (
        <button
          type="button"
          onClick={() => {
            const next = data.pagination.cursor
            if (next) void navigate({ search: (prev) => ({ ...prev, cursor: next }) })
          }}
          className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-100"
        >
          Page suivante
        </button>
      )}

      <section className="rounded border border-slate-200 bg-slate-100 p-4 text-sm">
        <p className="font-medium">Diagnostic TanStack Router</p>
        <ul className="mt-2 list-inside list-disc text-slate-700">
          <li>✓ Loader exécuté ({data.total} indicateur(s) chargés)</li>
          <li>
            Search params parsés : <code>{JSON.stringify(search)}</code>
          </li>
          <li>✓ useSuspenseQuery branché</li>
          <li>🔒 Guard _authenticated franchi</li>
        </ul>
        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={() => {
              // Force une erreur en envoyant un statut invalide
              void navigate({
                search: (prev) => ({
                  ...prev,
                  statut: 'broken' as never,
                }),
              })
            }}
            className="mt-3 rounded border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
          >
            🐛 Forcer une erreur (search param invalide)
          </button>
        )}
      </section>
    </div>
  )
}
