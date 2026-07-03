import type { ApiKeyApiModel } from '@pilote/mb-shared/apiKey'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import { revokeApiKey } from '@/api/apiKeys'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Table } from '@/components/ui/Table'
import { extractApiError } from '@/lib/apiError'
import { apiKeysQueryOptions } from '@/queries/apiKeys'
import { session } from '@/session'

export const Route = createFileRoute('/_authed/api-keys/')({
  component: ApiKeysListComponent,
})

const STATUS_LABEL: Record<ApiKeyApiModel['status'], string> = {
  active: 'Active',
  expired: 'Expirée',
  revoked: 'Révoquée',
}

const STATUS_CLASS: Record<ApiKeyApiModel['status'], string> = {
  active: 'font-semibold text-primary',
  expired: 'text-text-muted',
  revoked: 'text-accent',
}

function ApiKeysListComponent() {
  const queryClient = useQueryClient()
  const isProd = session.current?.environment === 'prod'
  const query = useQuery(apiKeysQueryOptions())
  const items = query.data ?? []
  const [error, setError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeApiKey(id),
    onSuccess: async () => {
      setConfirmingId(null)
      await queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
    onError: (err: unknown) => {
      setConfirmingId(null)
      void extractApiError(err).then(setError)
    },
  })

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <span className="font-medium text-text">Clés API</span>
      </Breadcrumb>
      <PageHeading
        title="Clés API"
        subtitle={
          <>
            {items.length} clé{items.length > 1 ? 's' : ''} · environnement{' '}
            <b className={isProd ? 'text-accent' : undefined}>{session.current?.environment}</b>
          </>
        }
        action={
          <Button asChild>
            <Link to="/api-keys/nouveau">
              <Plus className="size-4" /> Créer une clé
            </Link>
          </Button>
        }
      />

      {query.isError ? (
        <p className="mb-4 text-sm font-medium text-accent">
          Impossible de charger les clés API. Une clé de session de rôle ADMIN est requise.
        </p>
      ) : null}
      {error ? <p className="mb-4 text-sm font-medium text-accent">{error}</p> : null}

      {items.length === 0 && !query.isLoading && !query.isError ? (
        <EmptyState title="Aucune clé API" description="Créez votre première clé API." />
      ) : (
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>Label</Table.HeaderCell>
              <Table.HeaderCell>Préfixe</Table.HeaderCell>
              <Table.HeaderCell>Rôle</Table.HeaderCell>
              <Table.HeaderCell>Statut</Table.HeaderCell>
              <Table.HeaderCell>Créée le</Table.HeaderCell>
              <Table.HeaderCell align="right" />
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {items.map((apiKey) => (
              <Table.Row key={apiKey.id}>
                <Table.Cell>
                  <Link
                    to="/api-keys/$id"
                    params={{ id: apiKey.id }}
                    className="font-semibold text-primary hover:underline"
                  >
                    {apiKey.label}
                  </Link>
                </Table.Cell>
                <Table.Cell>
                  <span className="font-mono text-text-muted">{apiKey.prefix}…</span>
                </Table.Cell>
                <Table.Cell>{apiKey.role}</Table.Cell>
                <Table.Cell>
                  <span className={STATUS_CLASS[apiKey.status]}>{STATUS_LABEL[apiKey.status]}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-text-muted">
                    {new Date(apiKey.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </Table.Cell>
                <Table.Cell align="right">
                  {apiKey.status === 'revoked' ? (
                    <span className="text-text-subtle">—</span>
                  ) : confirmingId === apiKey.id ? (
                    <span className="inline-flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        disabled={revokeMutation.isPending}
                        onClick={() => revokeMutation.mutate(apiKey.id)}
                        className="border-accent bg-accent text-primary-foreground hover:bg-accent"
                      >
                        Confirmer
                      </Button>
                      <Button
                        variant="tertiary"
                        size="sm"
                        type="button"
                        onClick={() => setConfirmingId(null)}
                      >
                        Annuler
                      </Button>
                    </span>
                  ) : (
                    <Button
                      variant="tertiary"
                      size="sm"
                      type="button"
                      onClick={() => setConfirmingId(apiKey.id)}
                    >
                      Révoquer
                    </Button>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  )
}
