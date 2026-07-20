import type { FeatureApiModel, FeatureEtat } from '@pilote/kpilote-shared/feature'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { Table } from '@pilote/kpilote-ui/Table'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'
import { clickableRowProps, stopRowActivation } from '@/lib/clickableRow'
import { searchUnaccent } from '@pilote/kpilote-shared/texte'
import { useAppConfig } from '@/context/AppConfigContext'
import { featuresQueryOptions, useModifierEtatFeatureMutation } from '@/queries/feature'

export const Route = createFileRoute('/_authed/features/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(featuresQueryOptions()),
  component: FeatureListComponent,
})

const ETAT_OPTIONS: { value: FeatureEtat; label: string }[] = [
  { value: 'ACTIVE', label: 'Actif (tous)' },
  { value: 'ACTIVE_POUR_UTILISATEUR', label: 'Actif (utilisateurs autorisés)' },
  { value: 'DESACTIVE', label: 'Désactivé' },
]

function FeatureListComponent() {
  const navigate = useNavigate()
  const { isProd, environment } = useAppConfig()
  const { data: features } = useSuspenseQuery(featuresQueryOptions())
  const [recherche, setRecherche] = useState('')
  const toast = useToast()

  const mutation = useModifierEtatFeatureMutation({
    onSuccess: () => toast({ title: 'État mis à jour.' }),
    onError: (err) => toast({ title: extractApiError(err), variant: 'error' }),
  })

  const items = useMemo(() => {
    const terme = searchUnaccent(recherche)
    if (!terme) return features
    return features.filter((feature) =>
      searchUnaccent(`${feature.nom} ${feature.key}`).includes(terme),
    )
  }, [features, recherche])

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <span className="font-medium text-text">Features</span>
      </Breadcrumb>
      <PageHeading
        title="Features"
        subtitle={
          <>
            {features.length} fonctionnalité{features.length > 1 ? 's' : ''} · environnement{' '}
            <b className={isProd ? 'text-red-marianne' : undefined}>{environment}</b>
          </>
        }
      />

      <div className="mb-4 flex max-w-sm items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
        <Search className="size-4 text-text-subtle" />
        <input
          value={recherche}
          onChange={(event) => setRecherche(event.target.value)}
          placeholder="Rechercher une feature…"
          className="w-full bg-transparent focus:outline-none"
        />
      </div>

      {features.length === 0 ? (
        <EmptyState
          title="Aucune feature"
          description="Les features sont créées via des migrations Prisma (script feature:creer)."
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
            {items.map((feature: FeatureApiModel) => (
              <Table.Row
                key={feature.id}
                {...clickableRowProps(
                  () => void navigate({ to: '/features/$id', params: { id: feature.id } }),
                )}
              >
                <Table.Cell>
                  <span className="font-semibold">{feature.nom}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="font-mono text-text-muted">{feature.key}</span>
                </Table.Cell>
                <Table.Cell>
                  {/* Contrôle interactif isolé du clic de navigation de la ligne. */}
                  <select
                    aria-label={`État de ${feature.nom}`}
                    value={feature.etat}
                    disabled={mutation.isPending}
                    {...stopRowActivation}
                    onChange={(event) =>
                      mutation.mutate({ id: feature.id, etat: event.target.value as FeatureEtat })
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
