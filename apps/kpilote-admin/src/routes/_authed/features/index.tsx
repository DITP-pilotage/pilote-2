import type {
  FeatureFlippingApiModel,
  FeatureFlippingEtat,
} from '@pilote/kpilote-shared/featureFlipping'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { modifierEtatFeatureFlipping } from '@/api/featureFlipping'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Table } from '@/components/ui/Table'
import { clickableRowProps } from '@/lib/clickableRow'
import { extractApiError } from '@/lib/apiError'
import { featureFlippingsQueryOptions } from '@/queries/featureFlipping'
import { session } from '@/session'

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
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isProd = session.current?.environment === 'prod'
  const query = useQuery(featureFlippingsQueryOptions())
  const [recherche, setRecherche] = useState('')
  const [error, setError] = useState<string | null>(null)

  const items = useMemo(() => {
    const liste = query.data ?? []
    const terme = recherche.trim().toLowerCase()
    if (!terme) return liste
    return liste.filter((ff) => `${ff.nom} ${ff.key}`.toLowerCase().includes(terme))
  }, [query.data, recherche])

  const total = query.data?.length ?? 0

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
            {total} fonctionnalité{total > 1 ? 's' : ''} · environnement{' '}
            <b className={isProd ? 'text-accent' : undefined}>{session.current?.environment}</b>
          </>
        }
      />

      {error ? <p className="mb-4 text-sm font-medium text-accent">{error}</p> : null}

      <div className="mb-4 flex max-w-sm items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
        <Search className="size-4 text-text-subtle" />
        <input
          value={recherche}
          onChange={(event) => setRecherche(event.target.value)}
          placeholder="Rechercher un feature flipping…"
          className="w-full bg-transparent focus:outline-none"
        />
      </div>

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
              <Table.HeaderCell />
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {items.map((ff: FeatureFlippingApiModel) => (
              <Table.Row
                key={ff.id}
                {...clickableRowProps(
                  () => void navigate({ to: '/feature-flipping/$id', params: { id: ff.id } }),
                )}
              >
                <Table.Cell>
                  <span className="font-semibold">{ff.nom}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="font-mono text-text-muted">{ff.key}</span>
                </Table.Cell>
                <Table.Cell>
                  {/* Contrôle interactif : on stoppe la propagation pour ne pas
                      déclencher la navigation de la ligne cliquable. */}
                  <select
                    aria-label={`État de ${ff.nom}`}
                    value={ff.etat}
                    disabled={mutation.isPending}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
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
                  <span className="text-primary">→</span>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  )
}
