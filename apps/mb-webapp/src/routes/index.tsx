// apps/mb-webapp/src/routes/index.tsx
import { SHARED_GREETING } from '@pilote/mb-shared'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

import { fetchSharedMessage } from '@/api/sharedMessage'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  const { auth } = Route.useRouteContext()
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['shared-message'],
    queryFn: fetchSharedMessage,
  })

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-semibold tracking-tight">Pilote MB</h1>
        <p className="mt-3 text-slate-600">
          Webapp Marque Blanche — squelette initial avec TanStack Router.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Démo TanStack Query (préservée)</h2>
        <pre className="rounded bg-slate-900 p-4 text-sm text-slate-100">
          {SHARED_GREETING}
        </pre>
        <pre className="rounded bg-slate-100 p-4 text-sm text-slate-800">
          {isPending && 'Chargement…'}
          {isError && `Erreur: ${error.message}`}
          {data && data.greeting}
        </pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Diagnostic TanStack Router</h2>
        <ul className="rounded border border-slate-200 bg-white p-4 text-sm">
          <li>✓ Router initialisé</li>
          <li>
            État auth : <strong>{auth.isAuthenticated ? 'authentifié' : 'anonyme'}</strong>
          </li>
        </ul>
        <div className="flex gap-3">
          <Link
            to="/indicateurs"
            search={{}}
            className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
          >
            Voir les indicateurs
          </Link>
          {!auth.isAuthenticated && (
            <Link
              to="/login"
              search={{}}
              className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Se connecter
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
