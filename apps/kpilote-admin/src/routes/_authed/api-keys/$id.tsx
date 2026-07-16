import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

import { ApiKeyInfos } from '@/components/ApiKeyInfos'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { PrincipalPermissions } from '@/components/PrincipalPermissions'
import { TabNav } from '@/components/ui/TabNav'
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

function ApiKeyDetailComponent() {
  const { id } = Route.useParams()
  const { data: apiKey } = useSuspenseQuery(apiKeyQueryOptions(id))
  const [tab, setTab] = useState<'identite' | 'permissions'>('identite')

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

      <TabNav
        tabs={[
          { key: 'identite', label: 'Identité' },
          { key: 'permissions', label: 'Permissions' },
        ]}
        active={tab}
        onChange={(key) => setTab(key as 'identite' | 'permissions')}
      />

      <div>
        {tab === 'identite' ? (
          <ApiKeyInfos apiKey={apiKey} />
        ) : (
          <PrincipalPermissions principalId={id} />
        )}
      </div>
    </div>
  )
}
