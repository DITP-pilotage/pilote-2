import { SHARED_GREETING } from '@pilote/mb-shared'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

import { fetchSharedMessage } from '@/api/sharedMessage'
import { Button } from '@/components/ui/Button'
import { Page } from '@/components/ui/Page'
import { Section } from '@/components/ui/Section'

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
    <Page
      title="Pilote MB"
      description="Webapp Marque Blanche — squelette initial avec TanStack Router."
      actions={
        <>
          <Button asChild>
            <Link to="/indicateurs" search={{}}>
              Voir les indicateurs
            </Link>
          </Button>
          {!auth.isAuthenticated && (
            <Button variant="secondary" type="button" onClick={() => auth.login()}>
              Se connecter
            </Button>
          )}
        </>
      }
    >
      <Section title="Démo TanStack Query (préservée)">
        <div className="space-y-3">
          <pre className="rounded bg-slate-900 p-4 text-sm text-slate-100">{SHARED_GREETING}</pre>
          <pre className="rounded bg-slate-100 p-4 text-sm text-slate-800">
            {isPending && 'Chargement…'}
            {isError && `Erreur: ${error.message}`}
            {data && data.greeting}
          </pre>
        </div>
      </Section>

      <Section title="Diagnostic TanStack Router">
        <ul className="text-sm text-text">
          <li>✓ Router initialisé</li>
          <li>
            État auth : <strong>{auth.isAuthenticated ? 'authentifié' : 'anonyme'}</strong>
          </li>
        </ul>
      </Section>
    </Page>
  )
}
