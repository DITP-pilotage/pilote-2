import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { ApiKeyInfos } from '@/components/ApiKeyInfos'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { PrincipalPermissions } from '@/components/PrincipalPermissions'
import { Tabs, TabsList, TabsTrigger } from '@pilote/kpilote-ui/Tabs'
import { apiKeyQueryOptions } from '@/queries/apiKeys'
import { indicateursAllQueryOptions } from '@/queries/indicateurs'
import { principalPermissionsQueryOptions } from '@/queries/permissions'

const searchSchema = z.object({
  onglet: z.enum(['identite', 'permissions']).default('identite'),
})

export const Route = createFileRoute('/_authed/api-keys/$id')({
  validateSearch: searchSchema,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(apiKeyQueryOptions(params.id)),
      context.queryClient.ensureQueryData(principalPermissionsQueryOptions(params.id)),
      context.queryClient.ensureQueryData(indicateursAllQueryOptions()),
    ])
  },
  component: ApiKeyDetailComponent,
})

function ApiKeyDetailComponent() {
  const { id } = Route.useParams()
  const { data: apiKey } = useSuspenseQuery(apiKeyQueryOptions(id))
  const { onglet } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

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

      <Tabs
        value={onglet}
        onValueChange={(valeur) => {
          void navigate({
            search: (prev) => ({ ...prev, onglet: valeur as typeof onglet }),
            replace: true,
          })
        }}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="identite">Identité</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>
      </Tabs>

      <div>
        {onglet === 'identite' ? (
          <ApiKeyInfos apiKey={apiKey} />
        ) : (
          <PrincipalPermissions principalId={id} />
        )}
      </div>
    </div>
  )
}
