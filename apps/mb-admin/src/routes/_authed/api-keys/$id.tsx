import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { PrincipalPermissions } from '@/components/PrincipalPermissions'
import { apiKeyQueryOptions } from '@/queries/apiKeys'
import { principalPermissionsQueryOptions } from '@/queries/permissions'

export const Route = createFileRoute('/_authed/api-keys/$id')({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(apiKeyQueryOptions(params.id)),
      context.queryClient.ensureQueryData(principalPermissionsQueryOptions(params.id)),
    ])
  },
  component: ApiKeyDetailComponent,
})

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  expired: 'Expirée',
  revoked: 'Révoquée',
}

function ApiKeyDetailComponent() {
  const { id } = Route.useParams()
  const { data: apiKey } = useSuspenseQuery(apiKeyQueryOptions(id))

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <Link to="/api-keys" className="hover:text-primary">
          Clés API
        </Link>
        <span className="font-medium text-text">{apiKey.label}</span>
      </Breadcrumb>
      <PageHeading
        title={apiKey.label}
        subtitle={<span className="font-mono">{apiKey.prefix}…</span>}
      />

      <div className="mx-auto max-w-2xl">
        <div className="mb-8 grid grid-cols-2 gap-4 rounded-xl border border-border bg-surface p-6 text-sm">
          <div>
            <span className="block text-text-muted">Rôle</span>
            <span className="text-text">{apiKey.role}</span>
          </div>
          <div>
            <span className="block text-text-muted">Statut</span>
            <span className="text-text">{STATUS_LABEL[apiKey.status] ?? apiKey.status}</span>
          </div>
          <div>
            <span className="block text-text-muted">Créée le</span>
            <span className="text-text">
              {new Date(apiKey.createdAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div>
            <span className="block text-text-muted">Expire le</span>
            <span className="text-text">
              {apiKey.expiresAt ? new Date(apiKey.expiresAt).toLocaleDateString('fr-FR') : '—'}
            </span>
          </div>
        </div>

        <PrincipalPermissions principalId={id} />
      </div>
    </div>
  )
}
