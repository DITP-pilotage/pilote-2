import type {
  FeatureFlippingApiModel,
  FeatureFlippingEtat,
} from '@pilote/kpilote-shared/featureFlipping'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

import { modifierEtatFeatureFlipping } from '@/api/featureFlipping'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Table } from '@/components/ui/Table'
import { extractApiError } from '@/lib/apiError'
import { featureFlippingsQueryOptions } from '@/queries/featureFlipping'

export const Route = createFileRoute('/_authed/feature-flipping/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(featureFlippingsQueryOptions()),
  component: FeatureFlippingListComponent,
})

const ETAT_OPTIONS: { value: FeatureFlippingEtat; label: string }[] = [
  { value: 'ACTIVE', label: 'Actif (tous)' },
  { value: 'ACTIVE_POUR_UTILISATEUR', label: 'Actif (utilisateurs autorisés)' },
  { value: 'DESACTIVE', label: 'Désactivé' },
]

function FeatureFlippingListComponent() {
  const queryClient = useQueryClient()
  const query = useQuery(featureFlippingsQueryOptions())
  const items = query.data ?? []
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: ({ id, etat }: { id: string; etat: FeatureFlippingEtat }) =>
      modifierEtatFeatureFlipping(id, etat),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['feature-flipping'] })
    },
    onError: (err: unknown) => void extractApiError(err).then(setError),
  })

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <span className="font-medium text-text">Feature flipping</span>
      </Breadcrumb>
      <PageHeading
        title="Feature flipping"
        subtitle={
          <>
            {items.length} fonctionnalité{items.length > 1 ? 's' : ''}
          </>
        }
      />

      {error ? <p className="mb-4 text-sm font-medium text-accent">{error}</p> : null}

      {items.length === 0 && !query.isLoading ? (
        <EmptyState
          title="Aucun feature flipping"
          description="Les feature flippings sont créés via des migrations Prisma (script ff:creer)."
        />
      ) : (
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>Nom</Table.HeaderCell>
              <Table.HeaderCell>Clé</Table.HeaderCell>
              <Table.HeaderCell>État</Table.HeaderCell>
              <Table.HeaderCell align="right" />
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {items.map((ff: FeatureFlippingApiModel) => (
              <Table.Row key={ff.id}>
                <Table.Cell>
                  <Link
                    to="/feature-flipping/$id"
                    params={{ id: ff.id }}
                    className="font-semibold text-primary hover:underline"
                  >
                    {ff.nom}
                  </Link>
                </Table.Cell>
                <Table.Cell>
                  <span className="font-mono text-text-muted">{ff.key}</span>
                </Table.Cell>
                <Table.Cell>
                  <select
                    aria-label={`État de ${ff.nom}`}
                    value={ff.etat}
                    disabled={mutation.isPending}
                    onChange={(event) =>
                      mutation.mutate({
                        id: ff.id,
                        etat: event.target.value as FeatureFlippingEtat,
                      })
                    }
                    className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                  >
                    {ETAT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Table.Cell>
                <Table.Cell align="right">
                  <Link
                    to="/feature-flipping/$id"
                    params={{ id: ff.id }}
                    className="text-sm text-primary hover:underline"
                  >
                    Fiche
                  </Link>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  )
}
